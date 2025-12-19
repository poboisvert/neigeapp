"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  getLandingPageById,
  createLandingPage,
  updateLandingPage,
  rowToLandingPageData,
  type LandingPageRow,
} from "@/lib/landing-pages";
import { getCurrentUser } from "@/lib/auth";
import { uploadImage } from "@/lib/storage";
import type { LandingPageData } from "@/components/landing-page-template";
import { Save, ArrowLeft, Upload, X, Plus } from "lucide-react";
import Link from "next/link";

export default function AdminEditLandingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const isNew = id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<LandingPageData>>({
    title: "",
    shortDescription: "",
    ctaButton: {
      text: "Get Started",
      href: "/app",
    },
  });
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    checkAuth();
    if (!isNew) {
      loadPage();
    }
  }, [id]);

  async function checkAuth() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      router.push("/app");
      return;
    }
    setUser(currentUser);
  }

  async function loadPage() {
    try {
      setLoading(true);
      const page = await getLandingPageById(id);
      const data = rowToLandingPageData(page);
      setFormData(data);
      setSlug(page.slug);
      setPublished(page.published);
    } catch (error) {
      console.error("Error loading page:", error);
      alert("Failed to load page");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(
    file: File,
    field: "heroImage" | "imageCarousel"
  ) {
    try {
      setUploadingImage(true);
      const url = await uploadImage(file);

      if (field === "heroImage") {
        setFormData({ ...formData, heroImage: url });
      } else if (field === "imageCarousel") {
        const currentImages = formData.imageCarousel?.images || [];
        setFormData({
          ...formData,
          imageCarousel: {
            ...formData.imageCarousel,
            images: [
              ...currentImages,
              {
                url,
                alt: file.name,
              },
            ],
          },
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  }

  function removeCarouselImage(index: number) {
    const currentImages = formData.imageCarousel?.images || [];
    setFormData({
      ...formData,
      imageCarousel: {
        ...formData.imageCarousel,
        images: currentImages.filter((_, i) => i !== index),
      },
    });
  }

  async function handleSave() {
    if (!slug.trim()) {
      alert("Please enter a slug");
      return;
    }

    if (!formData.title || !formData.shortDescription) {
      alert("Please fill in required fields");
      return;
    }

    try {
      setSaving(true);
      if (isNew) {
        await createLandingPage(slug, formData as LandingPageData, published);
      } else {
        await updateLandingPage(
          id,
          slug,
          formData as LandingPageData,
          published
        );
      }
      router.push("/admin/lp");
    } catch (error: any) {
      console.error("Error saving page:", error);
      alert(error.message || "Failed to save page");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <Link href='/admin/lp'>
            <Button variant='ghost' size='sm'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
          </Link>
          <h1 className='text-3xl font-bold mt-4'>
            {isNew ? "Create Landing Page" : "Edit Landing Page"}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className='mr-2 h-4 w-4' />
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className='space-y-6'>
        {/* Basic Info */}
        <div className='border-2 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-bold'>Basic Information</h2>

          <div>
            <Label htmlFor='slug'>Slug *</Label>
            <Input
              id='slug'
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder='snow-removal-info'
            />
            <p className='text-sm text-slate-500 mt-1'>
              URL: /lp/{slug || "your-slug"}
            </p>
          </div>

          <div>
            <Label htmlFor='title'>Title *</Label>
            <Input
              id='title'
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor='subtitle'>Subtitle</Label>
            <Input
              id='subtitle'
              value={formData.subtitle || ""}
              onChange={(e) =>
                setFormData({ ...formData, subtitle: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor='shortDescription'>Short Description *</Label>
            <Textarea
              id='shortDescription'
              value={formData.shortDescription || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shortDescription: e.target.value,
                })
              }
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor='heroImage'>Hero Image URL</Label>
            <Input
              id='heroImage'
              value={formData.heroImage || ""}
              onChange={(e) =>
                setFormData({ ...formData, heroImage: e.target.value })
              }
              placeholder='https://...'
            />
            <div className='mt-2'>
              <Label htmlFor='heroImageUpload' className='cursor-pointer'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={uploadingImage}
                  asChild
                >
                  <span>
                    <Upload className='mr-2 h-4 w-4' />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </span>
                </Button>
              </Label>
              <input
                id='heroImageUpload'
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "heroImage");
                }}
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className='border-2 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-bold'>Summary Section</h2>

          <div>
            <Label htmlFor='summary'>Summary</Label>
            <Textarea
              id='summary'
              value={formData.summary || ""}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor='summaryOrder'>Summary Order</Label>
            <Input
              id='summaryOrder'
              type='number'
              value={formData.summaryOrder || 1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  summaryOrder: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
        </div>

        {/* CTA Button */}
        <div className='border-2 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-bold'>CTA Button</h2>

          <div>
            <Label htmlFor='ctaText'>Button Text *</Label>
            <Input
              id='ctaText'
              value={formData.ctaButton?.text || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ctaButton: {
                    ...formData.ctaButton!,
                    text: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor='ctaHref'>Button Link *</Label>
            <Input
              id='ctaHref'
              value={formData.ctaButton?.href || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ctaButton: {
                    ...formData.ctaButton!,
                    href: e.target.value,
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor='ctaVariant'>Button Variant</Label>
            <select
              id='ctaVariant'
              value={formData.ctaButton?.variant || "default"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ctaButton: {
                    ...formData.ctaButton!,
                    variant: e.target.value as any,
                  },
                })
              }
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              <option value='default'>Default</option>
              <option value='destructive'>Destructive</option>
              <option value='outline'>Outline</option>
              <option value='secondary'>Secondary</option>
              <option value='ghost'>Ghost</option>
              <option value='link'>Link</option>
            </select>
          </div>
        </div>

        {/* What You Get Section */}
        <div className='border-2 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-bold'>What You Get Section</h2>

          <div>
            <Label htmlFor='whatYouGetTitle'>Title</Label>
            <Input
              id='whatYouGetTitle'
              value={formData.whatYouGet?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  whatYouGet: {
                    ...formData.whatYouGet,
                    title: e.target.value,
                    description: formData.whatYouGet?.description,
                    order: formData.whatYouGet?.order,
                    items: formData.whatYouGet?.items || [],
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor='whatYouGetDescription'>Description</Label>
            <Textarea
              id='whatYouGetDescription'
              value={formData.whatYouGet?.description || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  whatYouGet: {
                    ...formData.whatYouGet,
                    description: e.target.value,
                    title: formData.whatYouGet?.title,
                    order: formData.whatYouGet?.order,
                    items: formData.whatYouGet?.items || [],
                  },
                })
              }
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor='whatYouGetOrder'>Order</Label>
            <Input
              id='whatYouGetOrder'
              type='number'
              value={formData.whatYouGet?.order || 2}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  whatYouGet: {
                    ...formData.whatYouGet,
                    order: parseInt(e.target.value) || 2,
                    title: formData.whatYouGet?.title,
                    description: formData.whatYouGet?.description,
                    items: formData.whatYouGet?.items || [],
                  },
                })
              }
            />
          </div>

          <div>
            <div className='flex items-center justify-between mb-2'>
              <Label>Items</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  const currentItems = formData.whatYouGet?.items || [];
                  setFormData({
                    ...formData,
                    whatYouGet: {
                      ...formData.whatYouGet,
                      items: [...currentItems, { title: "", description: "" }],
                      title: formData.whatYouGet?.title,
                      description: formData.whatYouGet?.description,
                      order: formData.whatYouGet?.order,
                    },
                  });
                }}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            <div className='space-y-3'>
              {(formData.whatYouGet?.items || []).map((item, index) => (
                <div key={index} className='border rounded-lg p-3 space-y-2'>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Item title'
                      value={item.title || ""}
                      onChange={(e) => {
                        const newItems = [
                          ...(formData.whatYouGet?.items || []),
                        ];
                        newItems[index] = {
                          ...newItems[index],
                          title: e.target.value,
                        };
                        setFormData({
                          ...formData,
                          whatYouGet: {
                            ...formData.whatYouGet,
                            items: newItems,
                            title: formData.whatYouGet?.title,
                            description: formData.whatYouGet?.description,
                            order: formData.whatYouGet?.order,
                          },
                        });
                      }}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const newItems =
                          formData.whatYouGet?.items?.filter(
                            (_, i) => i !== index
                          ) || [];
                        setFormData({
                          ...formData,
                          whatYouGet: {
                            ...formData.whatYouGet,
                            items: newItems,
                            title: formData.whatYouGet?.title,
                            description: formData.whatYouGet?.description,
                            order: formData.whatYouGet?.order,
                          },
                        });
                      }}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                  <Input
                    placeholder='Item description (optional)'
                    value={item.description || ""}
                    onChange={(e) => {
                      const newItems = [...(formData.whatYouGet?.items || [])];
                      newItems[index] = {
                        ...newItems[index],
                        description: e.target.value,
                      };
                      setFormData({
                        ...formData,
                        whatYouGet: {
                          ...formData.whatYouGet,
                          items: newItems,
                          title: formData.whatYouGet?.title,
                          description: formData.whatYouGet?.description,
                          order: formData.whatYouGet?.order,
                        },
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Helping For Section */}
        <div className='border-2 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-bold'>Who We're Helping Section</h2>

          <div>
            <Label htmlFor='helpingForTitle'>Title</Label>
            <Input
              id='helpingForTitle'
              value={formData.helpingFor?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  helpingFor: {
                    ...formData.helpingFor,
                    title: e.target.value,
                    description: formData.helpingFor?.description,
                    order: formData.helpingFor?.order,
                    items: formData.helpingFor?.items || [],
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor='helpingForDescription'>Description</Label>
            <Textarea
              id='helpingForDescription'
              value={formData.helpingFor?.description || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  helpingFor: {
                    ...formData.helpingFor,
                    description: e.target.value,
                    title: formData.helpingFor?.title,
                    order: formData.helpingFor?.order,
                    items: formData.helpingFor?.items || [],
                  },
                })
              }
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor='helpingForOrder'>Order</Label>
            <Input
              id='helpingForOrder'
              type='number'
              value={formData.helpingFor?.order || 3}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  helpingFor: {
                    ...formData.helpingFor,
                    order: parseInt(e.target.value) || 3,
                    title: formData.helpingFor?.title,
                    description: formData.helpingFor?.description,
                    items: formData.helpingFor?.items || [],
                  },
                })
              }
            />
          </div>

          <div>
            <div className='flex items-center justify-between mb-2'>
              <Label>Items</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  const currentItems = formData.helpingFor?.items || [];
                  setFormData({
                    ...formData,
                    helpingFor: {
                      ...formData.helpingFor,
                      items: [...currentItems, { title: "", description: "" }],
                      title: formData.helpingFor?.title,
                      description: formData.helpingFor?.description,
                      order: formData.helpingFor?.order,
                    },
                  });
                }}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            <div className='space-y-3'>
              {(formData.helpingFor?.items || []).map((item, index) => (
                <div key={index} className='border rounded-lg p-3 space-y-2'>
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Item title'
                      value={item.title || ""}
                      onChange={(e) => {
                        const newItems = [
                          ...(formData.helpingFor?.items || []),
                        ];
                        newItems[index] = {
                          ...newItems[index],
                          title: e.target.value,
                        };
                        setFormData({
                          ...formData,
                          helpingFor: {
                            ...formData.helpingFor,
                            items: newItems,
                            title: formData.helpingFor?.title,
                            description: formData.helpingFor?.description,
                            order: formData.helpingFor?.order,
                          },
                        });
                      }}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const newItems =
                          formData.helpingFor?.items?.filter(
                            (_, i) => i !== index
                          ) || [];
                        setFormData({
                          ...formData,
                          helpingFor: {
                            ...formData.helpingFor,
                            items: newItems,
                            title: formData.helpingFor?.title,
                            description: formData.helpingFor?.description,
                            order: formData.helpingFor?.order,
                          },
                        });
                      }}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                  <Input
                    placeholder='Item description (optional)'
                    value={item.description || ""}
                    onChange={(e) => {
                      const newItems = [...(formData.helpingFor?.items || [])];
                      newItems[index] = {
                        ...newItems[index],
                        description: e.target.value,
                      };
                      setFormData({
                        ...formData,
                        helpingFor: {
                          ...formData.helpingFor,
                          items: newItems,
                          title: formData.helpingFor?.title,
                          description: formData.helpingFor?.description,
                          order: formData.helpingFor?.order,
                        },
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rich Content Section */}
        <div className='border-2 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-bold'>Rich Content Section</h2>

          <div>
            <Label htmlFor='richContent'>Rich Content (HTML)</Label>
            <Textarea
              id='richContent'
              value={formData.richContent || ""}
              onChange={(e) =>
                setFormData({ ...formData, richContent: e.target.value })
              }
              rows={10}
              placeholder='<h2>Title</h2><p>Content here...</p>'
            />
            <p className='text-sm text-slate-500 mt-1'>
              Enter HTML content. Supports: p, span, strong, em, a, ul, ol, li,
              br, h1-h6
            </p>
          </div>

          <div>
            <Label htmlFor='richContentOrder'>Rich Content Order</Label>
            <Input
              id='richContentOrder'
              type='number'
              value={formData.richContentOrder || 4}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  richContentOrder: parseInt(e.target.value) || 4,
                })
              }
            />
          </div>
        </div>

        {/* Media Section (YouTube) */}
        <div className='border-2 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-bold'>Media Section (YouTube)</h2>

          <div>
            <Label htmlFor='mediaTitle'>Title</Label>
            <Input
              id='mediaTitle'
              value={formData.media?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  media: {
                    ...formData.media,
                    title: e.target.value,
                    description: formData.media?.description,
                    youtubeUrl: formData.media?.youtubeUrl,
                    order: formData.media?.order,
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor='mediaDescription'>Description</Label>
            <Textarea
              id='mediaDescription'
              value={formData.media?.description || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  media: {
                    ...formData.media,
                    description: e.target.value,
                    title: formData.media?.title,
                    youtubeUrl: formData.media?.youtubeUrl,
                    order: formData.media?.order,
                  },
                })
              }
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor='youtubeUrl'>YouTube URL</Label>
            <Input
              id='youtubeUrl'
              value={formData.media?.youtubeUrl || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  media: {
                    ...formData.media,
                    youtubeUrl: e.target.value,
                    title: formData.media?.title,
                    description: formData.media?.description,
                    order: formData.media?.order,
                  },
                })
              }
              placeholder='https://www.youtube.com/watch?v=...'
            />
          </div>

          <div>
            <Label htmlFor='mediaOrder'>Media Order</Label>
            <Input
              id='mediaOrder'
              type='number'
              value={formData.media?.order || 6}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  media: {
                    ...formData.media,
                    order: parseInt(e.target.value) || 6,
                    title: formData.media?.title,
                    description: formData.media?.description,
                    youtubeUrl: formData.media?.youtubeUrl,
                  },
                })
              }
            />
          </div>
        </div>

        {/* Weather Forecast Section */}
        <div className='border-2 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-bold'>Weather Forecast Section</h2>

          <div>
            <Label htmlFor='weatherTitle'>Title</Label>
            <Input
              id='weatherTitle'
              value={formData.weatherForecast?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  weatherForecast: {
                    ...formData.weatherForecast,
                    title: e.target.value,
                    description: formData.weatherForecast?.description,
                    order: formData.weatherForecast?.order,
                    forecasts: formData.weatherForecast?.forecasts || [],
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor='weatherDescription'>Description</Label>
            <Textarea
              id='weatherDescription'
              value={formData.weatherForecast?.description || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  weatherForecast: {
                    ...formData.weatherForecast,
                    description: e.target.value,
                    title: formData.weatherForecast?.title,
                    order: formData.weatherForecast?.order,
                    forecasts: formData.weatherForecast?.forecasts || [],
                  },
                })
              }
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor='weatherOrder'>Weather Forecast Order</Label>
            <Input
              id='weatherOrder'
              type='number'
              value={formData.weatherForecast?.order || 1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  weatherForecast: {
                    ...formData.weatherForecast,
                    order: parseInt(e.target.value) || 1,
                    title: formData.weatherForecast?.title,
                    description: formData.weatherForecast?.description,
                    forecasts: formData.weatherForecast?.forecasts || [],
                  },
                })
              }
            />
          </div>

          <div>
            <div className='flex items-center justify-between mb-2'>
              <Label>Forecasts</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => {
                  const currentForecasts =
                    formData.weatherForecast?.forecasts || [];
                  setFormData({
                    ...formData,
                    weatherForecast: {
                      ...formData.weatherForecast,
                      forecasts: [...currentForecasts, { date: "" }],
                      title: formData.weatherForecast?.title,
                      description: formData.weatherForecast?.description,
                      order: formData.weatherForecast?.order,
                    },
                  });
                }}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
            <div className='space-y-4'>
              {(formData.weatherForecast?.forecasts || []).map(
                (forecast, index) => (
                  <div key={index} className='border rounded-lg p-4 space-y-3'>
                    <div className='flex items-center justify-between'>
                      <Label>Forecast {index + 1}</Label>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          const newForecasts =
                            formData.weatherForecast?.forecasts?.filter(
                              (_, i) => i !== index
                            ) || [];
                          setFormData({
                            ...formData,
                            weatherForecast: {
                              ...formData.weatherForecast,
                              forecasts: newForecasts,
                              title: formData.weatherForecast?.title,
                              description:
                                formData.weatherForecast?.description,
                              order: formData.weatherForecast?.order,
                            },
                          });
                        }}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>

                    <div>
                      <Label>Date</Label>
                      <Input
                        value={forecast.date || ""}
                        onChange={(e) => {
                          const newForecasts = [
                            ...(formData.weatherForecast?.forecasts || []),
                          ];
                          newForecasts[index] = {
                            ...newForecasts[index],
                            date: e.target.value,
                          };
                          setFormData({
                            ...formData,
                            weatherForecast: {
                              ...formData.weatherForecast,
                              forecasts: newForecasts,
                              title: formData.weatherForecast?.title,
                              description:
                                formData.weatherForecast?.description,
                              order: formData.weatherForecast?.order,
                            },
                          });
                        }}
                        placeholder='Today'
                      />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                      {/* Snow */}
                      <div className='space-y-2'>
                        <Label>Snow</Label>
                        <Input
                          placeholder='Amount (e.g., 5-10 cm)'
                          value={forecast.snow?.amount || ""}
                          onChange={(e) => {
                            const newForecasts = [
                              ...(formData.weatherForecast?.forecasts || []),
                            ];
                            newForecasts[index] = {
                              ...newForecasts[index],
                              snow: {
                                ...newForecasts[index].snow,
                                amount: e.target.value,
                                probability:
                                  newForecasts[index].snow?.probability,
                              },
                            };
                            setFormData({
                              ...formData,
                              weatherForecast: {
                                ...formData.weatherForecast,
                                forecasts: newForecasts,
                              },
                            });
                          }}
                        />
                        <Input
                          type='number'
                          placeholder='Probability %'
                          value={forecast.snow?.probability || ""}
                          onChange={(e) => {
                            const newForecasts = [
                              ...(formData.weatherForecast?.forecasts || []),
                            ];
                            newForecasts[index] = {
                              ...newForecasts[index],
                              snow: {
                                ...newForecasts[index].snow,
                                amount: newForecasts[index].snow?.amount,
                                probability:
                                  parseInt(e.target.value) || undefined,
                              },
                            };
                            setFormData({
                              ...formData,
                              weatherForecast: {
                                ...formData.weatherForecast,
                                forecasts: newForecasts,
                              },
                            });
                          }}
                        />
                      </div>

                      {/* Rain */}
                      <div className='space-y-2'>
                        <Label>Rain</Label>
                        <Input
                          placeholder='Amount (e.g., 2-5 mm)'
                          value={forecast.rain?.amount || ""}
                          onChange={(e) => {
                            const newForecasts = [
                              ...(formData.weatherForecast?.forecasts || []),
                            ];
                            newForecasts[index] = {
                              ...newForecasts[index],
                              rain: {
                                ...newForecasts[index].rain,
                                amount: e.target.value,
                                probability:
                                  newForecasts[index].rain?.probability,
                              },
                            };
                            setFormData({
                              ...formData,
                              weatherForecast: {
                                ...formData.weatherForecast,
                                forecasts: newForecasts,
                              },
                            });
                          }}
                        />
                        <Input
                          type='number'
                          placeholder='Probability %'
                          value={forecast.rain?.probability || ""}
                          onChange={(e) => {
                            const newForecasts = [
                              ...(formData.weatherForecast?.forecasts || []),
                            ];
                            newForecasts[index] = {
                              ...newForecasts[index],
                              rain: {
                                ...newForecasts[index].rain,
                                amount: newForecasts[index].rain?.amount,
                                probability:
                                  parseInt(e.target.value) || undefined,
                              },
                            };
                            setFormData({
                              ...formData,
                              weatherForecast: {
                                ...formData.weatherForecast,
                                forecasts: newForecasts,
                              },
                            });
                          }}
                        />
                      </div>

                      {/* Temperature */}
                      <div className='space-y-2'>
                        <Label>Temperature</Label>
                        <div className='flex gap-2'>
                          <Input
                            type='number'
                            placeholder='Low'
                            value={forecast.temperature?.low || ""}
                            onChange={(e) => {
                              const newForecasts = [
                                ...(formData.weatherForecast?.forecasts || []),
                              ];
                              newForecasts[index] = {
                                ...newForecasts[index],
                                temperature: {
                                  ...newForecasts[index].temperature,
                                  low: parseInt(e.target.value) || undefined,
                                  high: newForecasts[index].temperature?.high,
                                  unit:
                                    newForecasts[index].temperature?.unit ||
                                    "C",
                                },
                              };
                              setFormData({
                                ...formData,
                                weatherForecast: {
                                  ...formData.weatherForecast,
                                  forecasts: newForecasts,
                                },
                              });
                            }}
                          />
                          <Input
                            type='number'
                            placeholder='High'
                            value={forecast.temperature?.high || ""}
                            onChange={(e) => {
                              const newForecasts = [
                                ...(formData.weatherForecast?.forecasts || []),
                              ];
                              newForecasts[index] = {
                                ...newForecasts[index],
                                temperature: {
                                  ...newForecasts[index].temperature,
                                  low: newForecasts[index].temperature?.low,
                                  high: parseInt(e.target.value) || undefined,
                                  unit:
                                    newForecasts[index].temperature?.unit ||
                                    "C",
                                },
                              };
                              setFormData({
                                ...formData,
                                weatherForecast: {
                                  ...formData.weatherForecast,
                                  forecasts: newForecasts,
                                },
                              });
                            }}
                          />
                          <select
                            value={forecast.temperature?.unit || "C"}
                            onChange={(e) => {
                              const newForecasts = [
                                ...(formData.weatherForecast?.forecasts || []),
                              ];
                              newForecasts[index] = {
                                ...newForecasts[index],
                                temperature: {
                                  ...newForecasts[index].temperature,
                                  low: newForecasts[index].temperature?.low,
                                  high: newForecasts[index].temperature?.high,
                                  unit: e.target.value as "C" | "F",
                                },
                              };
                              setFormData({
                                ...formData,
                                weatherForecast: {
                                  ...formData.weatherForecast,
                                  forecasts: newForecasts,
                                },
                              });
                            }}
                            className='flex h-10 w-20 rounded-md border border-input bg-background px-2 py-2 text-sm'
                          >
                            <option value='C'>°C</option>
                            <option value='F'>°F</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Image Carousel */}
        <div className='border-2 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-bold'>Image Carousel</h2>

          <div>
            <Label htmlFor='carouselTitle'>Carousel Title</Label>
            <Input
              id='carouselTitle'
              value={formData.imageCarousel?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  imageCarousel: {
                    ...formData.imageCarousel,
                    title: e.target.value,
                    images: formData.imageCarousel?.images || [],
                  },
                })
              }
            />
          </div>

          <div>
            <Label htmlFor='carouselDescription'>Carousel Description</Label>
            <Textarea
              id='carouselDescription'
              value={formData.imageCarousel?.description || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  imageCarousel: {
                    ...formData.imageCarousel,
                    description: e.target.value,
                    title: formData.imageCarousel?.title,
                    order: formData.imageCarousel?.order,
                    images: formData.imageCarousel?.images || [],
                  },
                })
              }
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor='carouselOrder'>Carousel Order</Label>
            <Input
              id='carouselOrder'
              type='number'
              value={formData.imageCarousel?.order || 7}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  imageCarousel: {
                    ...formData.imageCarousel,
                    order: parseInt(e.target.value) || 7,
                    title: formData.imageCarousel?.title,
                    description: formData.imageCarousel?.description,
                    images: formData.imageCarousel?.images || [],
                  },
                })
              }
            />
          </div>

          <div>
            <Label>Upload Images</Label>
            <div className='mt-2'>
              <Label htmlFor='carouselUpload' className='cursor-pointer'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={uploadingImage}
                  asChild
                >
                  <span>
                    <Upload className='mr-2 h-4 w-4' />
                    {uploadingImage ? "Uploading..." : "Add Image"}
                  </span>
                </Button>
              </Label>
              <input
                id='carouselUpload'
                type='file'
                accept='image/*'
                className='hidden'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "imageCarousel");
                }}
              />
            </div>
          </div>

          {formData.imageCarousel?.images &&
            formData.imageCarousel.images.length > 0 && (
              <div className='grid grid-cols-2 gap-4 mt-4'>
                {formData.imageCarousel.images.map((img, index) => (
                  <div key={index} className='relative border-2 rounded-lg p-2'>
                    <img
                      src={img.url}
                      alt={img.alt || `Image ${index + 1}`}
                      className='w-full h-32 object-cover rounded'
                    />
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      className='absolute top-2 right-2'
                      onClick={() => removeCarouselImage(index)}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                    <Input
                      placeholder='Alt text'
                      value={img.alt || ""}
                      onChange={(e) => {
                        const newImages = [...formData.imageCarousel!.images!];
                        newImages[index] = {
                          ...newImages[index],
                          alt: e.target.value,
                        };
                        setFormData({
                          ...formData,
                          imageCarousel: {
                            ...formData.imageCarousel!,
                            images: newImages,
                          },
                        });
                      }}
                      className='mt-2'
                    />
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Pros and Cons */}
        <div className='border-2 rounded-lg p-6 space-y-4'>
          <h2 className='text-xl font-bold'>Pros and Cons</h2>

          <div>
            <Label htmlFor='prosConsTitle'>Title</Label>
            <Input
              id='prosConsTitle'
              value={formData.prosAndCons?.title || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prosAndCons: {
                    ...formData.prosAndCons,
                    title: e.target.value,
                    pros: formData.prosAndCons?.pros || [],
                    cons: formData.prosAndCons?.cons || [],
                  },
                })
              }
              placeholder='Pros and Cons'
            />
          </div>

          <div>
            <Label htmlFor='prosConsOrder'>Order</Label>
            <Input
              id='prosConsOrder'
              type='number'
              value={formData.prosAndCons?.order || 5}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  prosAndCons: {
                    ...formData.prosAndCons,
                    order: parseInt(e.target.value) || 5,
                    pros: formData.prosAndCons?.pros || [],
                    cons: formData.prosAndCons?.cons || [],
                  },
                })
              }
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Pros */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <Label>Pros</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const currentPros = formData.prosAndCons?.pros || [];
                    setFormData({
                      ...formData,
                      prosAndCons: {
                        ...formData.prosAndCons,
                        pros: [...currentPros, ""],
                        cons: formData.prosAndCons?.cons || [],
                      },
                    });
                  }}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              <div className='space-y-2'>
                {(formData.prosAndCons?.pros || []).map((pro, index) => (
                  <div key={index} className='flex gap-2'>
                    <Input
                      value={pro}
                      onChange={(e) => {
                        const newPros = [...(formData.prosAndCons?.pros || [])];
                        newPros[index] = e.target.value;
                        setFormData({
                          ...formData,
                          prosAndCons: {
                            ...formData.prosAndCons,
                            pros: newPros,
                            cons: formData.prosAndCons?.cons || [],
                          },
                        });
                      }}
                      placeholder={`Pro ${index + 1}`}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const newPros =
                          formData.prosAndCons?.pros?.filter(
                            (_, i) => i !== index
                          ) || [];
                        setFormData({
                          ...formData,
                          prosAndCons: {
                            ...formData.prosAndCons,
                            pros: newPros,
                            cons: formData.prosAndCons?.cons || [],
                          },
                        });
                      }}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Cons */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <Label>Cons</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const currentCons = formData.prosAndCons?.cons || [];
                    setFormData({
                      ...formData,
                      prosAndCons: {
                        ...formData.prosAndCons,
                        cons: [...currentCons, ""],
                        pros: formData.prosAndCons?.pros || [],
                      },
                    });
                  }}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
              <div className='space-y-2'>
                {(formData.prosAndCons?.cons || []).map((con, index) => (
                  <div key={index} className='flex gap-2'>
                    <Input
                      value={con}
                      onChange={(e) => {
                        const newCons = [...(formData.prosAndCons?.cons || [])];
                        newCons[index] = e.target.value;
                        setFormData({
                          ...formData,
                          prosAndCons: {
                            ...formData.prosAndCons,
                            cons: newCons,
                            pros: formData.prosAndCons?.pros || [],
                          },
                        });
                      }}
                      placeholder={`Con ${index + 1}`}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        const newCons =
                          formData.prosAndCons?.cons?.filter(
                            (_, i) => i !== index
                          ) || [];
                        setFormData({
                          ...formData,
                          prosAndCons: {
                            ...formData.prosAndCons,
                            cons: newCons,
                            pros: formData.prosAndCons?.pros || [],
                          },
                        });
                      }}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Published Status */}
        <div className='border-2 rounded-lg p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <Label htmlFor='published'>Published</Label>
              <p className='text-sm text-slate-500'>
                Published pages are visible to everyone
              </p>
            </div>
            <Switch
              id='published'
              checked={published}
              onCheckedChange={setPublished}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
