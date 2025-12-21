"use client";

import { useTranslation } from "react-i18next";
import { ExpandableCards } from "@/components/expandable-cards";

export function WhyChooseUs() {
  const { t } = useTranslation("common");

  return (
    <>
      <div className='w-full bg-[#9CADB7] px-8 lg:px-16 py-16 lg:py-24 rounded-t-[40px] -mt-12 relative z-10 overflow-hidden'>
        <div className='snow-effect'>
          <div className='snow-effect-layer' />
        </div>

        <div className='relative z-10'>
          <div className='mb-8'>
            <p className='text-sm lg:text-base text-gray-800 font-light mb-4'>
              {t("whyChooseUs.label")}
            </p>
            <h2 className='text-3xl lg:text-5xl xl:text-6xl font-light tracking-tight text-gray-900 uppercase'>
              {t("whyChooseUs.title")
                .split("\n")
                .map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < t("whyChooseUs.title").split("\n").length - 1 && (
                      <br />
                    )}
                  </span>
                ))}
            </h2>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6'>
            <div className='bg-[#E8DDD0] rounded-3xl p-8 lg:p-10 flex flex-col justify-between min-h-[280px]'>
              <div>
                <h3 className='text-xl lg:text-2xl font-light text-gray-900 mb-6 uppercase'>
                  {t("whyChooseUs.feature1Title")
                    .split("\n")
                    .map((line, i) => (
                      <span key={i}>
                        {line}
                        {i <
                          t("whyChooseUs.feature1Title").split("\n").length -
                            1 && <br />}
                      </span>
                    ))}
                </h3>
              </div>
              <p className='text-sm lg:text-base text-gray-700 leading-relaxed'>
                {t("whyChooseUs.feature1Description")}
              </p>
            </div>

            <div className='bg-[#E8DDD0] rounded-3xl p-8 lg:p-10 flex flex-col justify-between min-h-[280px]'>
              <div>
                <h3 className='text-xl lg:text-2xl font-light text-gray-900 mb-6 uppercase'>
                  {t("whyChooseUs.feature2Title")
                    .split("\n")
                    .map((line, i) => (
                      <span key={i}>
                        {line}
                        {i <
                          t("whyChooseUs.feature2Title").split("\n").length -
                            1 && <br />}
                      </span>
                    ))}
                </h3>
              </div>
              <p className='text-sm lg:text-base text-gray-700 leading-relaxed'>
                {t("whyChooseUs.feature2Description")}
              </p>
            </div>

            <div className='lg:row-span-2 rounded-3xl overflow-hidden relative min-h-[280px] lg:min-h-full'>
              <img
                src='https://images.pexels.com/photos/1661179/pexels-photo-1661179.jpeg?auto=compress&cs=tinysrgb&w=1200'
                alt='Montreal winter scene'
                className='w-full h-full object-cover'
              />
            </div>

            <div className='lg:row-span-2 rounded-3xl overflow-hidden relative min-h-[280px] lg:min-h-full'>
              <img
                src='https://images.pexels.com/photos/1659437/pexels-photo-1659437.jpeg?auto=compress&cs=tinysrgb&w=1200'
                alt='Montreal street scene'
                className='w-full h-full object-cover'
              />
            </div>

            <div className='bg-[#E8DDD0] rounded-3xl p-8 lg:p-10 flex flex-col justify-between min-h-[280px]'>
              <div>
                <h3 className='text-xl lg:text-2xl font-light text-gray-900 mb-6 uppercase'>
                  {t("whyChooseUs.feature3Title")
                    .split("\n")
                    .map((line, i) => (
                      <span key={i}>
                        {line}
                        {i <
                          t("whyChooseUs.feature3Title").split("\n").length -
                            1 && <br />}
                      </span>
                    ))}
                </h3>
              </div>
              <p className='text-sm lg:text-base text-gray-700 leading-relaxed'>
                {t("whyChooseUs.feature3Description")}
              </p>
            </div>

            <div className='bg-[#E8DDD0] rounded-3xl p-8 lg:p-10 flex flex-col justify-between min-h-[280px]'>
              <div>
                <h3 className='text-xl lg:text-2xl font-light text-gray-900 mb-6 uppercase'>
                  {t("whyChooseUs.feature4Title")
                    .split("\n")
                    .map((line, i) => (
                      <span key={i}>
                        {line}
                        {i <
                          t("whyChooseUs.feature4Title").split("\n").length -
                            1 && <br />}
                      </span>
                    ))}
                </h3>
              </div>
              <p className='text-sm lg:text-base text-gray-700 leading-relaxed'>
                {t("whyChooseUs.feature4Description")}
              </p>
            </div>
          </div>
        </div>
        <ExpandableCards />
      </div>
    </>
  );
}
