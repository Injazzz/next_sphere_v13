"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CircleHelp,
  Users,
  FileText,
  BarChart3,
  Mail,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
  Bug,
  MessageSquare,
} from "lucide-react";

export default function HelpSupport() {
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    email: "",
    type: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  const handleInputChange = (
    field: "name" | "email" | "type" | "subject" | "message",
    value: string
  ) => {
    setFeedbackForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(feedbackForm),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus("success");
        setFeedbackForm({
          name: "",
          email: "",
          type: "",
          subject: "",
          message: "",
        });
      } else {
        throw new Error(
          result.error || "Terjadi kesalahan saat mengirim feedback"
        );
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(""), 8000);
    }
  };

  const steps = [
    {
      icon: Users,
      title: "Buat Team",
      description:
        "Jika Anda memiliki tim, mulailah dengan membuat team terlebih dahulu untuk mengelola dokumen secara kolaboratif.",
    },
    {
      icon: FileText,
      title: "Tambah Dokumen",
      description:
        "Buka tab Documents, isi form dengan lengkap, upload file yang ingin di-track, pilih client dan tentukan timeline.",
    },
    {
      icon: BarChart3,
      title: "Monitor & Analisis",
      description:
        "Gunakan Reports & Analytics untuk melihat summary kinerja pribadi dan tim, serta unduh report untuk evaluasi.",
    },
  ];

  const features = [
    {
      title: "Dashboard",
      description:
        "Ringkasan analytics dan overview performa dokumen tracking Anda",
      icon: "📊",
    },
    {
      title: "Team Management",
      description:
        "Kelola anggota tim dan atur hak akses untuk kolaborasi yang efektif",
      icon: "👥",
    },
    {
      title: "Client Portal",
      description:
        "Client menerima email konfirmasi dan dapat mengakses sistem dengan OTP",
      icon: "🔐",
    },
    {
      title: "Document Tracking",
      description:
        "Upload, track, dan kelola dokumen dengan timeline dan reminder otomatis",
      icon: "📄",
    },
    {
      title: "Timeline & Reminders",
      description:
        "Set deadline dan terima notifikasi overdue untuk menghindari keterlambatan",
      icon: "⏰",
    },
    {
      title: "Analytics & Reports",
      description:
        "Dapatkan insights mendalam tentang kinerja tim dan unduh laporan berkala",
      icon: "📈",
    },
  ];

  return (
    <div className='min-h-screen p-4 md:p-8'>
      <div className='max-w-6xl mx-auto space-y-8'>
        {/* Header */}
        <div className='text-center space-y-4'>
          <div className='flex justify-center'>
            <div className='bg-blue-500 p-3 rounded-full'>
              <CircleHelp className='h-8 w-8 text-white' />
            </div>
          </div>
          <h1 className='text-4xl font-bold'>Help & Support</h1>
          <p className='text-xl max-w-2xl mx-auto'>
            Panduan lengkap untuk menggunakan aplikasi Document Tracking dan
            mendapatkan bantuan yang Anda butuhkan
          </p>
        </div>

        <Tabs defaultValue='guide' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-3 lg:grid-cols-3'>
            <TabsTrigger value='guide' className='text-sm'>
              📖
              <span className='hidden md:block'>Panduan Penggunaan</span>
            </TabsTrigger>
            <TabsTrigger value='features' className='text-sm'>
              ⚡<span className='hidden md:block'> Fitur Aplikasi</span>
            </TabsTrigger>
            <TabsTrigger value='support' className='text-sm'>
              💬
              <span className='hidden md:block'>Feedback & Support</span>
            </TabsTrigger>
          </TabsList>

          {/* Panduan Penggunaan */}
          <TabsContent value='guide' className='space-y-6'>
            <Card className='border-0 shadow-lg backdrop-blur-sm'>
              <CardHeader className='pb-8'>
                <CardTitle className='text-2xl text-center'>
                  Cara Menggunakan Aplikasi Document Tracking
                </CardTitle>
                <CardDescription className='text-center text-lg'>
                  Ikuti langkah-langkah berikut untuk memulai tracking dokumen
                  Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid gap-8 md:grid-cols-3'>
                  {steps.map((step, index) => (
                    <div key={index} className='relative'>
                      <div className='flex flex-col items-center text-center space-y-4'>
                        <div className='bg-blue-500 p-4 rounded-full'>
                          <step.icon className='h-8 w-8' />
                        </div>
                        <div className='space-y-2'>
                          <h3 className='text-xl font-semibold '>
                            {index + 1}. {step.title}
                          </h3>
                          <p className=' leading-relaxed'>{step.description}</p>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className='hidden md:block absolute top-12 left-full w-full'>
                          <ArrowRight className='h-6 w-6 mx-auto' />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Guide */}
            <div className='grid gap-6 md:grid-cols-2'>
              <Card className='border-0 shadow-lg backdrop-blur-sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Users className='h-5 w-5 text-blue-500' />
                    Untuk Administrator Tim
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-3'>
                    <div className='flex items-start gap-3'>
                      <CheckCircle className='h-5 w-5 text-green-500 mt-0.5 flex-shrink-0' />
                      <p className=''>
                        Buat tim dan undang anggota untuk kolaborasi
                      </p>
                    </div>
                    <div className='flex items-start gap-3'>
                      <CheckCircle className='h-5 w-5 text-green-500 mt-0.5 flex-shrink-0' />
                      <p className=''>
                        Atur hak akses dan peran setiap anggota tim
                      </p>
                    </div>
                    <div className='flex items-start gap-3'>
                      <CheckCircle className='h-5 w-5 text-green-500 mt-0.5 flex-shrink-0' />
                      <p className=''>
                        Monitor kinerja tim melalui dashboard analytics
                      </p>
                    </div>
                    <div className='flex items-start gap-3'>
                      <CheckCircle className='h-5 w-5 text-green-500 mt-0.5 flex-shrink-0' />
                      <p className=''>
                        Unduh laporan berkala untuk evaluasi kinerja
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className='border-0 shadow-lg backdrop-blur-sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Shield className='h-5 w-5 text-green-500' />
                    Untuk Client
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-3'>
                    <div className='flex items-start gap-3'>
                      <Mail className='h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0' />
                      <p className=''>
                        Terima email konfirmasi saat dokumen dibuat
                      </p>
                    </div>
                    <div className='flex items-start gap-3'>
                      <Shield className='h-5 w-5 text-green-500 mt-0.5 flex-shrink-0' />
                      <p className=''>Login dengan email dan OTP yang aman</p>
                    </div>
                    <div className='flex items-start gap-3'>
                      <FileText className='h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0' />
                      <p className=''>
                        Lihat semua dokumen yang terkait dengan Anda
                      </p>
                    </div>
                    <div className='flex items-start gap-3'>
                      <Clock className='h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0' />
                      <p className=''>
                        Monitor status dan timeline dokumen real-time
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fitur Aplikasi */}
          <TabsContent value='features' className='space-y-6'>
            <Card className='border-0 shadow-lg backdrop-blur-sm'>
              <CardHeader>
                <CardTitle className='text-2xl text-center'>
                  Fitur Unggulan
                </CardTitle>
                <CardDescription className='text-center'>
                  Jelajahi semua fitur powerful yang tersedia di aplikasi
                  Document Tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {features.map((feature, index) => (
                    <Card
                      key={index}
                      className='border hover:shadow-md transition-shadow'
                    >
                      <CardContent className='p-6 space-y-3'>
                        <div className='text-3xl'>{feature.icon}</div>
                        <h3 className='text-lg font-semibold'>
                          {feature.title}
                        </h3>
                        <p className=' text-sm leading-relaxed'>
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback & Support */}
          <TabsContent value='support' className='space-y-6'>
            <div className='grid gap-6 lg:grid-cols-2'>
              {/* Feedback Form */}
              <Card className='border-0 shadow-lg backdrop-blur-sm'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <MessageSquare className='h-5 w-5 text-blue-500' />
                    Kirim Feedback atau Laporkan Bug
                  </CardTitle>
                  <CardDescription>
                    Bantu kami meningkatkan aplikasi dengan feedback Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    <div className='grid gap-4 md:grid-cols-2'>
                      <div className='space-y-2'>
                        <Label htmlFor='name'>Nama Lengkap</Label>
                        <Input
                          id='name'
                          value={feedbackForm.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          placeholder='Masukkan nama Anda'
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='email'>Email</Label>
                        <Input
                          id='email'
                          type='email'
                          value={feedbackForm.email}
                          onChange={(e) =>
                            handleInputChange("email", e.target.value)
                          }
                          placeholder='nama@email.com'
                          required
                        />
                      </div>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='type'>Tipe Laporan</Label>
                      <Select
                        onValueChange={(value) =>
                          handleInputChange("type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Pilih tipe laporan' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='bug'>🐛 Bug Report</SelectItem>
                          <SelectItem value='feature'>
                            ✨ Feature Request
                          </SelectItem>
                          <SelectItem value='feedback'>
                            💬 General Feedback
                          </SelectItem>
                          <SelectItem value='support'>
                            🆘 Technical Support
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='subject'>Subject</Label>
                      <Input
                        id='subject'
                        value={feedbackForm.subject}
                        onChange={(e) =>
                          handleInputChange("subject", e.target.value)
                        }
                        placeholder='Ringkas masalah atau feedback Anda'
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='message'>Detail Pesan</Label>
                      <Textarea
                        id='message'
                        value={feedbackForm.message}
                        onChange={(e) =>
                          handleInputChange("message", e.target.value)
                        }
                        placeholder='Jelaskan secara detail masalah, feedback, atau request Anda...'
                        className='min-h-[120px]'
                        required
                      />
                    </div>

                    {submitStatus === "success" && (
                      <Alert className='border-green-200 bg-green-50'>
                        <CheckCircle className='h-4 w-4 text-green-600' />
                        <AlertDescription className='text-green-800'>
                          Terima kasih! Feedback Anda telah berhasil dikirim.
                          Tim kami akan merespons dalam 1-2 hari kerja.
                        </AlertDescription>
                      </Alert>
                    )}

                    {submitStatus === "error" && (
                      <Alert className='border-red-200 bg-red-50'>
                        <Bug className='h-4 w-4 text-red-600' />
                        <AlertDescription className='text-red-800'>
                          Terjadi kesalahan saat mengirim pesan. Silakan coba
                          lagi atau hubungi kami langsung.
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      onClick={handleSubmit}
                      className='w-full'
                      disabled={
                        isSubmitting ||
                        !feedbackForm.name ||
                        !feedbackForm.email ||
                        !feedbackForm.type ||
                        !feedbackForm.subject ||
                        !feedbackForm.message
                      }
                    >
                      {isSubmitting ? "Mengirim..." : "Kirim Feedback"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className='space-y-6'>
                <Card className='border-0 shadow-lg backdrop-blur-sm'>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <Mail className='h-5 w-5 text-green-500' />
                      Kontak Developer
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='p-4 rounded-lg'>
                      <p className='text-sm  mb-2'>Email Developer:</p>
                      <p className='font-mono text-blue-600 font-medium'>
                        kamal.akbarzy@gmail.com
                      </p>
                    </div>
                    <p className='text-sm '>
                      Untuk pertanyaan teknis, bug report, atau diskusi
                      pengembangan aplikasi, Anda dapat menghubungi developer
                      langsung melalui email di atas.
                    </p>
                  </CardContent>
                </Card>

                <Card className='border-0 shadow-lg backdrop-blur-sm'>
                  <CardHeader>
                    <CardTitle>FAQ Singkat</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='space-y-3'>
                      <div className='border-l-4 border-blue-500 pl-4'>
                        <h4 className='font-semibold text-zinc-700 dark:text-slate-500'>
                          Bagaimana cara reset password?
                        </h4>
                        <p className='text-sm '>
                          Gunakan fitur &quot;Forgot Password&quot; di halaman
                          login.
                        </p>
                      </div>
                      <div className='border-l-4 border-green-500 pl-4'>
                        <h4 className='font-semibold text-zinc-700 dark:text-slate-500'>
                          Client tidak menerima email dan access token?
                        </h4>
                        <p className='text-sm '>
                          Periksa folder spam/junk email atau hubungi admin.
                        </p>
                      </div>
                      <div className='border-l-4 border-purple-500 pl-4'>
                        <h4 className='font-semibold text-zinc-700 dark:text-slate-500'>
                          Bagaimana cara unduh report?
                        </h4>
                        <p className='text-sm '>
                          Masuk ke Reports & Analytics, pilih periode, lalu klik
                          export, pilih format dan &quot;Download&quot;.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
