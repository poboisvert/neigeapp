"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Hero } from "@/components/hero";
import { Send, MessageCircle } from "lucide-react";

export default function ContactPage() {
  const { t } = useTranslation("common");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <div className='min-h-screen'>
      <Hero />

      {/* Contact Content Container with rounded top corners */}
      <div className='bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 -mt-8 relative z-10 rounded-t-3xl'>
        <div className='max-w-3xl mx-auto px-8 lg:px-20 py-16 lg:py-24'>
          {/* Contact Form */}
          <div className='bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-lg p-10 shadow-sm mb-12'>
            <div className='flex items-center gap-3 mb-8'>
              <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                <MessageCircle className='w-5 h-5 text-blue-600' />
              </div>
              <h2 className='text-2xl font-light text-slate-800 dark:text-slate-200'>
                {t("contact.sendMessage")}
              </h2>
            </div>
            <p className='text-slate-600 dark:text-slate-400 mb-8 font-light leading-relaxed'>
              {t("contact.messageDescription")}
            </p>

            <form onSubmit={handleSubmit} className='space-y-6'>
              <div>
                <label className='text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 block'>
                  {t("contact.name")}
                </label>
                <Input
                  required
                  placeholder={t("contact.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className='bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-12 rounded-md'
                />
              </div>

              <div>
                <label className='text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 block'>
                  {t("contact.email")}
                </label>
                <Input
                  required
                  type='email'
                  placeholder={t("contact.emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className='bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-12 rounded-md'
                />
              </div>

              <div>
                <label className='text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 block'>
                  {t("contact.subject")}
                </label>
                <Input
                  required
                  placeholder={t("contact.subjectPlaceholder")}
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className='bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-12 rounded-md'
                />
              </div>

              <div>
                <label className='text-slate-700 dark:text-slate-300 text-sm font-medium mb-2 block'>
                  {t("contact.message")}
                </label>
                <Textarea
                  required
                  placeholder={t("contact.messagePlaceholder")}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className='bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 min-h-[150px] rounded-md resize-none'
                />
              </div>

              <Button
                type='submit'
                className='w-full bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-medium py-6 text-base rounded-md transition-all shadow-sm hover:shadow-md group flex items-center justify-center gap-2 mt-8'
              >
                {t("contact.send")}
                <Send className='w-4 h-4 transition-transform group-hover:translate-x-1' />
              </Button>
            </form>
          </div>

          {/* FAQ Section */}
          <div className='bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-lg p-10 shadow-sm'>
            <h2 className='text-2xl font-light text-slate-800 dark:text-slate-200 mb-8'>
              {t("contact.faq.title")}
            </h2>
            <Accordion type='single' collapsible className='w-full'>
              <AccordionItem value='item-1'>
                <AccordionTrigger className='text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'>
                  {t("contact.faq.question1")}
                </AccordionTrigger>
                <AccordionContent className='text-slate-600 dark:text-slate-400'>
                  {t("contact.faq.answer1")}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value='item-2'>
                <AccordionTrigger className='text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'>
                  {t("contact.faq.question2")}
                </AccordionTrigger>
                <AccordionContent className='text-slate-600 dark:text-slate-400'>
                  {t("contact.faq.answer2")}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value='item-3'>
                <AccordionTrigger className='text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'>
                  {t("contact.faq.question3")}
                </AccordionTrigger>
                <AccordionContent className='text-slate-600 dark:text-slate-400'>
                  {t("contact.faq.answer3")}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value='item-4'>
                <AccordionTrigger className='text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'>
                  {t("contact.faq.question4")}
                </AccordionTrigger>
                <AccordionContent className='text-slate-600 dark:text-slate-400'>
                  {t("contact.faq.answer4")}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value='item-5'>
                <AccordionTrigger className='text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'>
                  {t("contact.faq.question5")}
                </AccordionTrigger>
                <AccordionContent className='text-slate-600 dark:text-slate-400'>
                  {t("contact.faq.answer5")}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value='item-6'>
                <AccordionTrigger className='text-left text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'>
                  {t("contact.faq.question6")}
                </AccordionTrigger>
                <AccordionContent className='text-slate-600 dark:text-slate-400'>
                  {t("contact.faq.answer6")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
