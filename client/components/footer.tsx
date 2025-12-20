"use client";

import { useTranslation } from "react-i18next";
import Link from "next/link";
import { Twitter, Instagram } from "lucide-react";

export function Footer() {
  const { t } = useTranslation("common");

  return (
    <footer className='bg-[#ECD137] py-12 px-8'>
      <div className='max-w-7xl mx-auto'>
        <div className='grid grid-cols-2 md:grid-cols-6 gap-8 mb-16'>
          <div>
            <h3 className='font-bold text-black mb-4 text-sm uppercase tracking-wide'>
              {t("footer.tours")}
            </h3>
            <ul className='space-y-2 text-sm text-black'>
              <li>
                <Link href='/' className='hover:opacity-70 transition-opacity'>
                  {t("footer.allTours")}
                </Link>
              </li>
              <li>
                <Link href='/' className='hover:opacity-70 transition-opacity'>
                  {t("footer.featured")}
                </Link>
              </li>
              <li>
                <Link href='/' className='hover:opacity-70 transition-opacity'>
                  {t("footer.popular")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-bold text-black mb-4 text-sm uppercase tracking-wide'>
              {t("footer.contact")}
            </h3>
            <ul className='space-y-2 text-sm text-black'>
              <li>
                <Link
                  href='/contact'
                  className='hover:opacity-70 transition-opacity'
                >
                  {t("footer.email")}
                </Link>
              </li>
              <li>
                <a href='#' className='hover:opacity-70 transition-opacity'>
                  <Twitter className='inline w-4 h-4 mr-1' />X
                </a>
              </li>
              <li>
                <a href='#' className='hover:opacity-70 transition-opacity'>
                  <Instagram className='inline w-4 h-4 mr-1' />
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-bold text-black mb-4 text-sm uppercase tracking-wide'>
              {t("footer.media")}
            </h3>
            <ul className='space-y-2 text-sm text-black'>
              <li>
                <a href='#' className='hover:opacity-70 transition-opacity'>
                  {t("footer.pressKit")}
                </a>
              </li>
              <li>
                <a href='#' className='hover:opacity-70 transition-opacity'>
                  {t("footer.gallery")}
                </a>
              </li>
              <li>
                <a href='#' className='hover:opacity-70 transition-opacity'>
                  {t("footer.stories")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-bold text-black mb-4 text-sm uppercase tracking-wide'>
              {t("footer.resources")}
            </h3>
            <ul className='space-y-2 text-sm text-black'>
              <li>
                <a href='#' className='hover:opacity-70 transition-opacity'>
                  {t("footer.blog")}
                </a>
              </li>
              <li>
                <a href='#' className='hover:opacity-70 transition-opacity'>
                  {t("footer.guides")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className='font-bold text-black mb-4 text-sm uppercase tracking-wide'>
              {t("footer.legal")}
            </h3>
            <ul className='space-y-2 text-sm text-black'>
              <li>
                <a href='#' className='hover:opacity-70 transition-opacity'>
                  {t("footer.privacy")}
                </a>
              </li>
              <li>
                <a href='#' className='hover:opacity-70 transition-opacity'>
                  {t("footer.terms")}
                </a>
              </li>
            </ul>
          </div>

          <div className='text-right'>
            <p className='text-xs text-black mb-1'>
              © {new Date().getFullYear()} {t("footer.copyright")}
            </p>
            <p className='text-xs text-black'>{t("footer.rights")}</p>
          </div>
        </div>

        <div className='text-center'>
          <Link href='/' className='inline-block'>
            <h2 className='text-6xl md:text-8xl font-bold text-black tracking-tight'>
              <span className='font-patrick-hand'>Neige.app</span>
            </h2>
          </Link>
        </div>
      </div>
    </footer>
  );
}
