"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function Hero() {
  const { t } = useTranslation("common");
  return (
    <div className='h-[70vh] relative'>
      <div
        className='absolute inset-0 bg-cover bg-center bg-no-repeat'
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/19584061/pexels-photo-19584061.jpeg?auto=compress&cs=tinysrgb&w=1920')",
        }}
      >
        <div className='absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60' />
      </div>

      <div className='relative z-10 flex flex-col h-full'>
        <nav className='flex items-center justify-between px-8 lg:px-16 py-6'>
          <div className='text-yellow text-sm lg:text-base font-medium tracking-wider drop-shadow-lg'>
            <span className='font-patrick-hand'>Neige.app</span>
          </div>

          <div className='hidden md:flex items-center gap-8 lg:gap-12'>
            <a
              href='/'
              className='text-yellow hover:text-yellow/80 transition-colors text-sm drop-shadow-md'
            >
              {t("nav.home")}
            </a>
            <a
              href='/app'
              className='text-yellow hover:text-yellow/80 transition-colors text-sm drop-shadow-md'
            >
              {t("nav.liveMap")}
            </a>
            <a
              href='/contact'
              className='text-yellow hover:text-yellow/80 transition-colors text-sm drop-shadow-md'
            >
              {t("nav.contact")}
            </a>
          </div>
        </nav>

        <div className='flex-1 flex flex-col justify-center items-center px-8 lg:px-16 py-12 max-w-5xl mx-auto text-center'>
          <div className='mb-6'>
            <div className='text-yellow text-xs lg:text-sm font-medium tracking-widest drop-shadow-lg'>
              {t("hero.tagline")}
            </div>
          </div>

          <h1 className='text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-yellow leading-none tracking-tight mb-8 drop-shadow-2xl'>
            {t("hero.title")
              .split("\n")
              .map((line, i) => (
                <span key={i}>
                  {line}
                  {i < t("hero.title").split("\n").length - 1 && <br />}
                </span>
              ))}
          </h1>

          <p className='text-yellow text-lg lg:text-xl max-w-2xl drop-shadow-lg leading-relaxed mb-12'>
            {t("hero.description")}
          </p>

          <Button
            asChild
            className='bg-yellow hover:bg-yellow/90 text-black font-bold px-16 py-7 text-lg rounded-full transition-all shadow-2xl hover:shadow-yellow/20 group flex items-center gap-3'
          >
            <a href='/app'>
              {t("hero.cta")}
              <ArrowRight className='w-6 h-6 transition-transform group-hover:translate-x-2' />
            </a>
          </Button>

          <div className='flex flex-wrap justify-center items-center gap-8 mt-16 text-yellow/90'>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-yellow rounded-full'></div>
              <span className='text-xs lg:text-sm font-medium drop-shadow-lg'>
                {t("hero.updates")}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-yellow rounded-full'></div>
              <span className='text-xs lg:text-sm font-medium drop-shadow-lg'>
                {t("hero.alerts")}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-yellow rounded-full'></div>
              <span className='text-xs lg:text-sm font-medium drop-shadow-lg'>
                {t("hero.allStreets")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
