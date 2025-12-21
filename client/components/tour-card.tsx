"use client";

import { useTranslation } from "react-i18next";

export function TourCard() {
  const { t } = useTranslation("common");

  return (
    <div className='relative -mt-24 z-30 w-full'>
      <div className='bg-[#E8DDD0] rounded-t-[40px] px-8 lg:px-16 py-12 lg:py-16'>
        <div className='grid lg:grid-cols-12 gap-8 items-start'>
          <div className='lg:col-span-2'>
            <p className='text-sm lg:text-base text-gray-700 font-light'>
              {t("tour.about")}
            </p>
          </div>

          <div className='lg:col-span-10'>
            <div className='relative'>
              <h2 className='text-3xl lg:text-5xl xl:text-6xl font-light tracking-tight text-gray-900 mb-8 uppercase'>
                {t("tour.title")
                  .split("\n")
                  .map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < t("tour.title").split("\n").length - 1 && <br />}
                    </span>
                  ))}
              </h2>

              <div className='grid lg:grid-cols-2 gap-8'>
                <div className='space-y-4'>
                  <p className='text-sm lg:text-base text-gray-700 leading-relaxed'>
                    {t("tour.description1")}
                  </p>
                  <p className='text-sm lg:text-base text-gray-700 leading-relaxed'>
                    {t("tour.description2")}
                  </p>
                </div>

                <div>
                  <p className='text-sm lg:text-base text-gray-700 leading-relaxed'>
                    {t("tour.description3")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
