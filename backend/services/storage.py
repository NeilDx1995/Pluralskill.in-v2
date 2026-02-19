import logging
import os
import shutil
import uuid
from pathlib import Path

import boto3
from botocore.exceptions import NoCredentialsError
from fastapi import HTTPException, UploadFile

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self, upload_dir: Path):
        self.upload_dir = upload_dir
        self.bucket_name = os.environ.get("AWS_BUCKET_NAME")
        self.aws_region = os.environ.get("AWS_REGION", "us-east-1")
        self.s3_client = None

        if self.bucket_name:
            try:
                self.s3_client = boto3.client(
                    "s3",
                    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
                    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
                    region_name=self.aws_region,
                )
                logger.info(f"Initialized S3 storage with bucket: {self.bucket_name}")
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {e}")
                self.s3_client = None

    async def upload_file(self, file: UploadFile, directory: str) -> dict:
        """
        Uploads a file to either S3 or local storage.

        Args:
            file: The FastAPI UploadFile object
            directory: The subdirectory (images, videos, documents)

        Returns:
            dict: { "url": str, "filename": str, "size": int, "content_type": str }
        """
        ext = Path(file.filename).suffix
        unique_name = f"{uuid.uuid4()}{ext}"
        content_type = file.content_type

        # Calculate size
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)

        if self.s3_client:
            return self._upload_to_s3(file, directory, unique_name, size, content_type)
        else:
            return self._upload_to_local(
                file, directory, unique_name, size, content_type
            )

    def _upload_to_local(
        self,
        file: UploadFile,
        directory: str,
        unique_name: str,
        size: int,
        content_type: str,
    ) -> dict:
        file_path = self.upload_dir / directory / unique_name

        # Ensure directory exists
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Return local URL (relative path)
        url = f"/uploads/{directory}/{unique_name}"

        return {
            "url": url,
            "filename": file.filename,
            "size": size,
            "content_type": content_type,
        }

    def _upload_to_s3(
        self,
        file: UploadFile,
        directory: str,
        unique_name: str,
        size: int,
        content_type: str,
    ) -> dict:
        key = f"{directory}/{unique_name}"

        try:
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket_name,
                key,
                ExtraArgs={"ContentType": content_type},
            )

            # Construct S3 URL
            # Virtual-hosted-style URL: https://bucket-name.s3.region.amazonaws.com/key
            url = f"https://{self.bucket_name}.s3.{self.aws_region}.amazonaws.com/{key}"

            return {
                "url": url,
                "filename": file.filename,
                "size": size,
                "content_type": content_type,
            }
        except NoCredentialsError:
            logger.error("AWS Credentials not found")
            raise HTTPException(status_code=500, detail="AWS Credentials conflict")
        except Exception as e:
            logger.error(f"S3 Upload Error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"S3 Upload failed: {str(e)}")

    async def delete_file(self, file_url: str):
        """
        Deletes a file from storage based on its URL.
        """
        if not file_url:
            return

        if "amazonaws.com" in file_url and self.s3_client:
            # Extract key from S3 URL
            # Format: https://bucket.s3.region.amazonaws.com/folder/file.ext
            try:
                path_parts = file_url.split(".com/")
                if len(path_parts) > 1:
                    key = path_parts[1]
                    self.s3_client.delete_object(Bucket=self.bucket_name, Key=key)
            except Exception as e:
                logger.error(f"Failed to delete S3 object {file_url}: {e}")

        elif file_url.startswith("/uploads/"):
            # Local file
            try:
                # Remove leading /uploads/ to get relative path from UPLOAD_DIR
                rel_path = file_url.replace("/uploads/", "")
                file_path = self.upload_dir / rel_path
                if file_path.exists():
                    os.remove(file_path)
            except Exception as e:
                logger.error(f"Failed to delete local file {file_url}: {e}")
