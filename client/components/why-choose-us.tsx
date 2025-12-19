"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";

interface Card {
  id: number;
  titleKey: string;
  descriptionKey: string;
  image: string;
}

const cards: Card[] = [
  {
    id: 1,
    titleKey: "card1Title",
    descriptionKey: "card1Description",
    image:
      "https://images.pexels.com/photos/15229948/pexels-photo-15229948.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 2,
    titleKey: "card2Title",
    descriptionKey: "card2Description",
    image:
      "https://images.pexels.com/photos/19481829/pexels-photo-19481829.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 3,
    titleKey: "card3Title",
    descriptionKey: "card3Description",
    image:
      "https://images.pexels.com/photos/20139664/pexels-photo-20139664.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 4,
    titleKey: "card4Title",
    descriptionKey: "card4Description",
    image:
      "https://images.pexels.com/photos/20131963/pexels-photo-20131963.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

export function WhyChooseUs() {
  const { t } = useTranslation("common");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <>
      <div className='w-full bg-[#9CADB7] px-8 lg:px-16 py-16 lg:py-24 rounded-t-[40px] -mt-12 relative z-20 overflow-hidden'>
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
      </div>

      <section className='py-4 px-8 bg-[#9CADB7]'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex gap-4 h-[500px]'>
            {cards.map((card) => {
              const isExpanded = expandedId === card.id;
              const hasExpanded = expandedId !== null;

              return (
                <div
                  key={card.id}
                  className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ease-in-out ${
                    isExpanded
                      ? "flex-[3]"
                      : hasExpanded
                      ? "flex-[0.7]"
                      : "flex-1"
                  }`}
                  onMouseEnter={() => setExpandedId(card.id)}
                  onMouseLeave={() => setExpandedId(null)}
                  onClick={() => setExpandedId(isExpanded ? null : card.id)}
                >
                  <div
                    className='absolute inset-0 bg-cover bg-center transition-transform duration-700'
                    style={{
                      backgroundImage: `url('${card.image}')`,
                      transform: isExpanded ? "scale(1.1)" : "scale(1)",
                    }}
                  />

                  <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent' />

                  <div className='relative h-full flex flex-col justify-end p-8'>
                    <div
                      className={`transition-all duration-700 ${
                        isExpanded
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-4"
                      }`}
                    >
                      <h3 className='text-3xl font-bold text-white mb-4'>
                        {t(`whyChooseUs.${card.titleKey}`)}
                      </h3>
                      <p className='text-white/90 text-base leading-relaxed mb-6'>
                        {t(`whyChooseUs.${card.descriptionKey}`)}
                      </p>
                      <button className='flex items-center gap-2 text-white hover:gap-3 transition-all group'>
                        <span className='font-medium'>
                          {t("whyChooseUs.learnMore")}
                        </span>
                        <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                      </button>
                    </div>

                    <div
                      className={`absolute bottom-8 left-8 transition-all duration-700 ${
                        isExpanded ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      <h3 className='text-2xl font-bold text-white'>
                        {t(`whyChooseUs.${card.titleKey}`)}
                      </h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
