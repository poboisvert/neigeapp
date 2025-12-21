"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

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

function CardContent({
  card,
  isExpanded,
  onExpand,
}: {
  card: Card;
  isExpanded: boolean;
  onExpand: () => void;
}) {
  const { t } = useTranslation("common");

  return (
    <div
      className='relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-700 ease-in-out h-[400px] lg:h-full'
      onMouseEnter={() => !isExpanded && onExpand()}
      onMouseLeave={() => isExpanded && onExpand()}
      onClick={onExpand}
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
            isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h3 className='text-3xl font-bold text-white mb-4'>
            {t(`whyChooseUs.${card.titleKey}`)}
          </h3>
          <p className='text-white/90 text-base leading-relaxed mb-6'>
            {t(`whyChooseUs.${card.descriptionKey}`)}
          </p>
          <button className='flex items-center gap-2 text-white hover:gap-3 transition-all group'>
            <span className='font-medium'>{t("whyChooseUs.learnMore")}</span>
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
}

export function ExpandableCards() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [emblaRef] = useEmblaCarousel(
    {
      align: "center",
      slidesToScroll: 1,
      containScroll: "trimSnaps",
      dragFree: false,
    },
    []
  );

  return (
    <section className='py-4'>
      <div className='max-w-7xl mx-auto'>
        {/* Mobile Carousel with Snap - All Cards Expanded */}
        <div
          className='lg:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide px-2'
          ref={emblaRef}
          style={{
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div className='flex gap-3'>
            {cards.map((card) => (
              <div
                key={card.id}
                className='flex-[0_0_92%] min-w-0 snap-center'
                style={{ paddingRight: "0.5rem" }}
              >
                <CardContent
                  card={card}
                  isExpanded={true}
                  onExpand={() => {}}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Expandable Cards */}
        <div className='hidden lg:flex gap-4 h-[500px]'>
          {cards.map((card) => {
            const isExpanded = expandedId === card.id;
            const hasExpanded = expandedId !== null;

            return (
              <div
                key={card.id}
                className={`transition-all duration-700 ease-in-out ${
                  isExpanded
                    ? "flex-[3]"
                    : hasExpanded
                    ? "flex-[0.7]"
                    : "flex-1"
                }`}
              >
                <CardContent
                  card={card}
                  isExpanded={isExpanded}
                  onExpand={() => setExpandedId(isExpanded ? null : card.id)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
