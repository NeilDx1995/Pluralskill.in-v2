import math


def paginated_response(items: list, total: int, page: int, limit: int):
    """Standard paginated response wrapper"""
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if limit > 0 else 1,
    }
