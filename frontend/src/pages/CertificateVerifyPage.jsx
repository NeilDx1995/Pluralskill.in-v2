import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { verifyCertificate } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';

const CertificateVerifyPage = () => {
  const { certificateNumber } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const data = await verifyCertificate(certificateNumber);
        setCertificate(data);
      } catch (err) {
        setError('Certificate not found');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [certificateNumber]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Award className="w-6 h-6 text-primary" />
              Certificate Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error || !certificate?.valid ? (
              <div className="text-center py-8">
                <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Invalid Certificate</h2>
                <p className="text-muted-foreground">
                  The certificate number "{certificateNumber}" could not be verified.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <Badge className="bg-green-100 text-green-700 mb-4">Verified</Badge>
                
                <h2 className="text-2xl font-heading font-bold mb-2">
                  {certificate.user_name}
                </h2>
                <p className="text-muted-foreground mb-6">
                  has successfully completed
                </p>
                <h3 className="text-xl font-semibold text-primary mb-6">
                  {certificate.course_title}
                </h3>
                
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-sm mb-6">
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-muted-foreground">Certificate ID</p>
                    <p className="font-mono font-medium">{certificate.certificate_number}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-muted-foreground">Issue Date</p>
                    <p className="font-medium">
                      {new Date(certificate.issued_at).toLocaleDateString()}
                    </p>
                  </div>
                  {certificate.quiz_score > 0 && (
                    <div className="bg-slate-50 p-4 rounded-lg col-span-2">
                      <p className="text-muted-foreground">Quiz Score</p>
                      <p className="font-medium">{certificate.quiz_score.toFixed(0)}%</p>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  This certificate is issued by PluralSkill and can be verified at any time.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CertificateVerifyPage;
