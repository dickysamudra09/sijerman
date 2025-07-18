"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export function FAQ() {
  const faqs = [
    {
      question: "Bagaimana cara mendaftar di EduPlatform?",
      answer: "Untuk mendaftar, klik tombol 'Daftar Gratis' di pojok kanan atas halaman. Isi formulir pendaftaran dengan nama lengkap, email, dan password. Setelah mendaftar, Anda akan menerima email konfirmasi untuk mengaktifkan akun."
    },
    {
      question: "Apakah semua course di EduPlatform gratis?",
      answer: "Ya, semua course dasar di EduPlatform gratis untuk diakses. Kami menyediakan materi pembelajaran berkualitas tinggi tanpa biaya. Namun, untuk fitur premium seperti sertifikat dan mentoring personal, tersedia paket berbayar."
    },
    {
      question: "Bagaimana cara mengakses course setelah mendaftar?",
      answer: "Setelah login, Anda dapat mengakses semua course yang tersedia. Pilih kelas A-1 atau A-2 sesuai dengan level Anda, kemudian klik pada course yang ingin dipelajari. Anda dapat mulai belajar langsung dari browser."
    },
    {
      question: "Apakah ada batas waktu untuk menyelesaikan course?",
      answer: "Tidak ada batas waktu yang ketat. Anda dapat belajar sesuai dengan kecepatan Anda sendiri. Namun, kami merekomendasikan untuk menyelesaikan course dalam waktu yang disarankan untuk hasil optimal."
    },
    {
      question: "Bagaimana cara melacak progress belajar saya?",
      answer: "Setiap course memiliki progress tracker yang menunjukkan perkembangan belajar Anda. Anda dapat melihat persentase penyelesaian, quiz yang telah dikerjakan, dan materi yang sudah dipelajari di dashboard pribadi."
    },
    {
      question: "Apakah tersedia sertifikat setelah menyelesaikan course?",
      answer: "Ya, Anda akan mendapatkan sertifikat digital setelah menyelesaikan seluruh materi course dan lulus quiz akhir dengan nilai minimal 80%. Sertifikat dapat diunduh dalam format PDF."
    },
    {
      question: "Bisakah saya mengakses course dari perangkat mobile?",
      answer: "Tentu saja! EduPlatform dioptimalkan untuk berbagai perangkat termasuk smartphone dan tablet. Anda dapat belajar kapan saja dan di mana saja dengan akses internet."
    },
    {
      question: "Bagaimana cara menghubungi dukungan teknis?",
      answer: "Jika Anda mengalami masalah teknis atau memiliki pertanyaan, Anda dapat menghubungi tim dukungan kami melalui email support@eduplatform.com atau melalui chat langsung yang tersedia di platform."
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="mb-4">Frequently Asked Questions</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Temukan jawaban untuk pertanyaan yang paling sering diajukan tentang EduPlatform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Pertanyaan Umum
          </CardTitle>
          <CardDescription>
            Klik pada pertanyaan untuk melihat jawabannya
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}