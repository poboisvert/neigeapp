"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentControl } from "@/components/ui/segment-control";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Snowflake,
  RefreshCw,
  ArrowLeft,
  Search,
  Star,
  User,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  supabase,
  signOut,
  getCurrentUser,
  onAuthStateChange,
} from "@/lib/auth";
import { searchAddress, type GeocodingResult } from "@/lib/geocoding";
import { AuthModal } from "@/components/auth-modal";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const SnowMap = dynamic(() => import("@/components/map"), {
  ssr: false,
});

export default function MapApp() {
  const [planifications, setPlanifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlanif, setSelectedPlanif] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [filterMode, setFilterMode] = useState<"all" | "favorites">("all");
  const [darkMode, setDarkMode] = useState(true);
  const [searchLocation, setSearchLocation] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
  } | null>(null);
  const [initialCenter, setInitialCenter] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
  } | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<GeocodingResult[]>(
    []
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [zoomTrigger, setZoomTrigger] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationCollapsed, setNotificationCollapsed] = useState(false);

  const getEtatDeneigColor = (etatDeneig: number): string => {
    const colorMap: Record<number, string> = {
      0: "#ff9671",
      1: "#22c55e",
      2: "#3b82f6",
      3: "#8b5cf6",
      4: "#f9f871",
      5: "#ef4444",
      10: "#6b7280",
    };
    return colorMap[etatDeneig] || "#6b7280";
  };

  const getEtatDeneigStatus = (etatDeneig: number): string => {
    const statusMap: Record<number, string> = {
      1: "Déneigé",
      2: "Planifié",
      3: "Replanifié",
      4: "Sera replanifié ultérieurement",
      5: "Chargement en cours",
      10: "Dégagé (entre 2 chargements de neige)",
    };
    return statusMap[etatDeneig] || "Status inconnu";
  };

  const loadSnowPlanning = useCallback(
    async (
      forceRefresh = false,
      bounds?: {
        minLat: number;
        minLng: number;
        maxLat: number;
        maxLng: number;
      }
    ) => {
      setLoading(true);
      try {
        let url = "/api/streets?include_snow=true";

        // Add bounding box parameters if provided
        if (bounds) {
          url += `&minLat=${bounds.minLat}&minLng=${bounds.minLng}&maxLat=${bounds.maxLat}&maxLng=${bounds.maxLng}`;
        }

        const response = await fetch(url, {
          cache: forceRefresh ? "no-store" : "default",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch snow planning data");
        }

        const result = await response.json();

        if (result.success && result.data) {
          const transformedData = result.data
            .filter(
              (street: any) =>
                street.deneigement_current && street.street_feature?.geometry
            )
            .map((street: any) => ({
              munid: 66023,
              coteRueId: street.cote_rue_id,
              etatDeneig: street.deneigement_current.etat_deneig,
              status: street.deneigement_current.status,
              dateDebutPlanif: street.deneigement_current.date_debut_planif,
              dateFinPlanif: street.deneigement_current.date_fin_planif,
              dateDebutReplanif: street.deneigement_current.date_debut_replanif,
              dateFinReplanif: street.deneigement_current.date_fin_replanif,
              dateMaj: street.deneigement_current.date_maj,
              streetFeature: street.street_feature,
            }));

          // If bounds are provided, merge with existing planifications to avoid duplicates
          if (bounds) {
            setPlanifications((prev) => {
              // Create a map of existing planifications by coteRueId
              const existingMap = new Map(prev.map((p) => [p.coteRueId, p]));

              // Add or update with new data
              transformedData.forEach((newPlanif: any) => {
                existingMap.set(newPlanif.coteRueId, newPlanif);
              });

              return Array.from(existingMap.values());
            });
          } else {
            // No bounds - replace all data (initial load)
            setPlanifications(transformedData);
          }
        }
      } catch (error) {
        console.error("Error loading snow planning:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleBoundsChange = useCallback(
    (bounds: {
      minLat: number;
      minLng: number;
      maxLat: number;
      maxLng: number;
    }) => {
      loadSnowPlanning(false, bounds);
    },
    [loadSnowPlanning]
  );

  const loadFavorites = async () => {
    if (!user) {
      setFavorites(new Set());
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_favorites")
        .select("cote_rue_id");

      if (error) throw error;

      const favoriteIds = new Set(data?.map((f) => f.cote_rue_id) || []);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  const toggleFavorite = async (coteRueId: number) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (favorites.has(coteRueId)) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("cote_rue_id", coteRueId)
          .eq("user_id", user.id);

        if (error) throw error;

        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(coteRueId);
          return newSet;
        });
      } else {
        const { error } = await supabase.from("user_favorites").insert({
          cote_rue_id: coteRueId,
          user_id: user.id,
        });

        if (error) throw error;

        setFavorites((prev) => new Set(prev).add(coteRueId));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleAvatarClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setShowUserMenu(!showUserMenu);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setFavorites(new Set());
    setShowUserMenu(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      const user = await getCurrentUser();
      setUser(user);
    };

    checkUser();

    const subscription = onAuthStateChange((user) => {
      setUser(user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    loadSnowPlanning();
  }, []);

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const response = await fetch(
          "https://ipv4-check-perf.radar.cloudflare.com/api/info"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch location");
        }
        const data = await response.json();

        // Handle different possible response formats
        const lat = data.latitude || data.lat;
        const lng = data.longitude || data.lng || data.lon;

        if (lat && lng) {
          setInitialCenter({
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            zoom: 15,
          });
        }
      } catch (error) {
        console.error("Error fetching user location:", error);
      }
    };

    fetchUserLocation();
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification", payload.new);
          setNotifications((n) => [payload.new, ...n]);
          setNotificationCollapsed(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredPlanifications =
    filterMode === "favorites"
      ? planifications.filter((p) => favorites.has(p.coteRueId))
      : planifications;

  const handleSearchInputChange = async (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 3) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchAddress(value);
      setSearchSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 500);
  };

  const handleSelectSuggestion = (suggestion: GeocodingResult) => {
    setSearchQuery(suggestion.display_name);
    setSearchLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      zoom: 15,
    });
    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length < 3) return;

    setIsSearching(true);
    const results = await searchAddress(searchQuery);

    if (results.length > 0) {
      const firstResult = results[0];
      setSearchLocation({
        lat: parseFloat(firstResult.lat),
        lng: parseFloat(firstResult.lon),
        zoom: 16,
      });
      setSearchQuery(firstResult.display_name);
    }

    setShowSuggestions(false);
    setSearchSuggestions([]);
    setIsSearching(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".search-container")) {
        setShowSuggestions(false);
      }
      if (!target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden ${
        darkMode ? "bg-gray-900" : "bg-white"
      }`}
    >
      <header
        className={`${
          darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        } border-b px-4 py-3 flex items-center gap-4 shrink-0`}
      >
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`lg:hidden ${
            darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
        >
          {sidebarOpen ? (
            <X
              className={`h-5 w-5 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            />
          ) : (
            <Menu
              className={`h-5 w-5 ${
                darkMode ? "text-gray-300" : "text-gray-700"
              }`}
            />
          )}
        </Button>
        <a
          href='/'
          className={`inline-flex items-center gap-2 transition-colors`}
        >
          <ArrowLeft
            className={`h-4 w-4 ${
              darkMode ? "text-gray-300" : "text-gray-700"
            }`}
          />
          <span
            className={`text-sm font-medium ${
              darkMode ? "text-gray-400" : "text-gray-900"
            }`}
          >
            Home
          </span>
        </a>
        <div className='flex items-center gap-1 flex-1'>
          <h1
            className={`text-2xl ${
              darkMode ? "text-gray-100" : "text-gray-900"
            } flex items-baseline`}
          >
            <span className='font-patrick-hand text-3xl'>Hello-Neige</span>
          </h1>
        </div>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setDarkMode(!darkMode)}
          className={`${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
        >
          {darkMode ? (
            <Sun className='h-5 w-5 text-gray-300' />
          ) : (
            <Moon className='h-5 w-5 text-gray-600' />
          )}
        </Button>
        <div className='relative user-menu-container'>
          <button onClick={handleAvatarClick} className='focus:outline-none'>
            <Avatar className='h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity'>
              <AvatarImage src='' alt='User' />
              <AvatarFallback
                className={`${
                  darkMode
                    ? "flex h-full w-full items-center justify-center text-gray-300 bg-blue-900"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <User className='h-5 w-5' />
              </AvatarFallback>
            </Avatar>
          </button>
          {showUserMenu && user && (
            <div
              className={`absolute right-0 top-12 w-64 rounded-lg shadow-lg border ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              } z-50`}
            >
              <div
                className={`px-4 py-3 border-b ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    darkMode ? "text-gray-200" : "text-gray-900"
                  }`}
                >
                  Signed in as
                </p>
                <p
                  className={`text-xs truncate ${
                    darkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className={`w-full px-4 py-3 text-left text-sm flex items-center gap-2 ${
                  darkMode
                    ? "hover:bg-gray-700 text-gray-200"
                    : "hover:bg-gray-50 text-gray-900"
                }`}
              >
                <LogOut className='h-4 w-4' />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={loadFavorites}
      />

      <div className='flex-1 flex overflow-hidden relative'>
        {sidebarOpen && (
          <div
            className='fixed inset-0 top-[57px] bg-black/50 z-40 lg:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`w-96 ${
            darkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          } border-r flex flex-col overflow-hidden fixed lg:relative top-[57px] lg:top-0 bottom-0 left-0 z-50 transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {notifications.length > 0 && (
            <div
              className={`overflow-hidden ${
                darkMode
                  ? "bg-gradient-to-r from-blue-900 to-blue-800 border-blue-700"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              } border-b`}
            >
              <div className='animate-slide-in'>
                {notificationCollapsed ? (
                  <div
                    className='p-2 flex items-center gap-3 cursor-pointer'
                    onClick={() => setNotificationCollapsed(false)}
                  >
                    <div className='shrink-0'>
                      <Bell className='h-5 w-5 text-white animate-shake-5s' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-white font-semibold text-sm truncate'>
                        Snow Removal Update
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotificationCollapsed(false);
                      }}
                      className='shrink-0 text-white/80 hover:text-white transition-colors'
                    >
                      <ChevronDown className='h-4 w-4' />
                    </button>
                  </div>
                ) : (
                  <div className='p-3 flex items-start gap-3'>
                    <div className='shrink-0 mt-0.5'>
                      <Bell className='h-5 w-5 text-white animate-shake-5s' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-white font-semibold text-sm mb-1'>
                        Snow Removal Update
                      </p>
                      <p className='text-white/90 text-xs leading-relaxed'>
                        Status changed from{" "}
                        <span className='font-medium'>
                          {getEtatDeneigStatus(notifications[0].old_etat)}
                        </span>{" "}
                        to{" "}
                        <span className='font-medium'>
                          {getEtatDeneigStatus(notifications[0].new_etat)}
                        </span>
                      </p>
                      <p className='text-white/70 text-xs mt-1'>
                        {new Date(
                          notifications[0].created_at
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setNotificationCollapsed(true)}
                      className='shrink-0 text-white/80 hover:text-white transition-colors'
                    >
                      <ChevronUp className='h-4 w-4' />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          <div
            className={`p-4 ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } border-b`}
          >
            <p
              className={`text-sm ${
                darkMode ? "text-gray-400" : "text-gray-600"
              } mb-3`}
            >
              {filteredPlanifications.length} of {planifications.length} streets
            </p>
            <div className='mb-3 flex justify-center'>
              <SegmentControl
                options={[
                  { value: "all", label: "All" },
                  { value: "favorites", label: "Favorites" },
                ]}
                value={filterMode}
                onValueChange={setFilterMode}
                className='w-full'
                darkMode={darkMode}
              />
            </div>
            <Button
              onClick={() => loadSnowPlanning(true)}
              disabled={loading}
              variant='outline'
              size='sm'
              className={`w-full ${
                darkMode
                  ? "bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-gray-100"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""} ${
                  darkMode ? "text-gray-200" : "text-gray-700"
                }`}
              />
              Refresh Data
            </Button>
          </div>

          <div className='flex-1 overflow-y-auto p-4'>
            <div className='space-y-2'>
              {filteredPlanifications.map((planif, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border transition-all relative ${
                    selectedPlanif === planif
                      ? darkMode
                        ? "bg-blue-900/30 border-blue-500"
                        : "bg-blue-50 border-blue-300"
                      : darkMode
                      ? "bg-gray-700 border-gray-600 hover:bg-blue-900/20 hover:border-blue-500"
                      : "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(planif.coteRueId);
                    }}
                    className={`absolute top-2 right-2 p-1 rounded-full ${
                      darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                    } transition-colors`}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        favorites.has(planif.coteRueId)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                  <div
                    className='space-y-1 pr-8 cursor-pointer'
                    onClick={() => {
                      setSelectedPlanif(planif);
                      setZoomTrigger((prev) => prev + 1);
                      setSidebarOpen(false);
                    }}
                  >
                    <p
                      className={`font-medium text-sm ${
                        darkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {planif.streetFeature?.properties?.NOM_VOIE}{" "}
                      {planif.streetFeature?.properties?.TYPE_F}
                    </p>
                    <div className='flex items-center gap-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{
                          backgroundColor: getEtatDeneigColor(
                            planif.etatDeneig
                          ),
                        }}
                      />
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <span className='font-medium'>
                          {getEtatDeneigStatus(planif.etatDeneig)}
                        </span>
                      </p>
                    </div>
                    <p
                      className={`text-xs ${
                        darkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {planif.streetFeature?.properties?.NOM_VILLE} •{" "}
                      {planif.streetFeature?.properties?.COTE}
                    </p>
                    {/* 
                      Only show the address if the value is not 0 or undefined/null.
                      Prevents rendering "0" as a valid address.
                    */}
                    {planif.streetFeature?.properties?.DEBUT_ADRESSE !==
                      undefined &&
                      planif.streetFeature?.properties?.DEBUT_ADRESSE !==
                        null &&
                      Number(
                        planif.streetFeature?.properties?.DEBUT_ADRESSE
                      ) !== 0 && (
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          Address:{" "}
                          {planif.streetFeature?.properties?.DEBUT_ADRESSE}
                        </p>
                      )}
                  </div>
                </div>
              ))}
              {filteredPlanifications.length === 0 && !loading && (
                <div className='text-center py-12'>
                  {filterMode === "favorites" ? (
                    <>
                      <Star
                        className={`h-12 w-12 ${
                          darkMode ? "text-gray-600" : "text-gray-300"
                        } mx-auto mb-3`}
                      />
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No favorites yet
                      </p>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        } mt-1`}
                      >
                        Click the star icon to add favorites
                      </p>
                    </>
                  ) : (
                    <>
                      <Snowflake
                        className={`h-12 w-12 ${
                          darkMode ? "text-gray-600" : "text-gray-300"
                        } mx-auto mb-3`}
                      />
                      <p
                        className={`text-sm ${
                          darkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No planifications available
                      </p>
                      <p
                        className={`text-xs ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        } mt-1`}
                      >
                        Click Refresh Data to load
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        <main className='flex-1 relative'>
          <div className='absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4'>
            <form onSubmit={handleSearch} className='relative search-container'>
              <div className='flex gap-2'>
                <div className='flex-1 relative'>
                  <Input
                    type='text'
                    placeholder='Search address in Montreal...'
                    value={searchQuery}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onFocus={() =>
                      searchSuggestions.length > 0 && setShowSuggestions(true)
                    }
                    className={`shadow-lg ${
                      darkMode
                        ? "bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400"
                        : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                    }`}
                  />
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div
                      className={`absolute top-full mt-2 w-full rounded-lg shadow-xl border ${
                        darkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      } max-h-80 overflow-y-auto z-50`}
                    >
                      {searchSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type='button'
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className={`w-full text-left px-4 py-3 hover:bg-opacity-80 transition-colors border-b last:border-b-0 ${
                            darkMode
                              ? "hover:bg-gray-700 border-gray-700 text-gray-100"
                              : "hover:bg-gray-50 border-gray-100 text-gray-900"
                          }`}
                        >
                          <div className='flex items-start gap-2'>
                            <MapPin
                              className={`h-4 w-4 mt-0.5 shrink-0 ${
                                darkMode ? "text-blue-400" : "text-blue-600"
                              }`}
                            />
                            <div className='flex-1 min-w-0'>
                              <p
                                className={`text-sm font-medium truncate ${
                                  darkMode ? "text-gray-100" : "text-gray-900"
                                }`}
                              >
                                {suggestion.address.road
                                  ? `${suggestion.address.house_number || ""} ${
                                      suggestion.address.road
                                    }`.trim()
                                  : suggestion.display_name.split(",")[0]}
                              </p>
                              <p
                                className={`text-xs truncate ${
                                  darkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                {[
                                  suggestion.address.suburb,
                                  suggestion.address.city ||
                                    suggestion.address.municipality,
                                  suggestion.address.postcode,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type='submit'
                  disabled={isSearching || searchQuery.trim().length < 3}
                  className='shadow-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                >
                  <Search className='h-4 w-4 mr-2' />
                  Search
                </Button>
              </div>
            </form>
          </div>
          <SnowMap
            planifications={planifications}
            selectedPlanification={selectedPlanif}
            darkMode={darkMode}
            searchLocation={searchLocation}
            initialCenter={initialCenter}
            zoomTrigger={zoomTrigger}
            onPlanificationClick={(planif) => {
              setSelectedPlanif(planif);
              setZoomTrigger((prev) => prev + 1);
            }}
            onBoundsChange={handleBoundsChange}
            enableDynamicFetching={true}
          />

          {selectedPlanif && (
            <div
              className='fixed lg:absolute bottom-0 left-0 lg:left-0 right-0 p-6 shadow-2xl z-20 transition-all'
              style={{
                backgroundColor: getEtatDeneigColor(selectedPlanif.etatDeneig),
              }}
            >
              <div className='max-w-4xl mx-auto'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-white font-bold text-2xl mb-1'>
                      {selectedPlanif.streetFeature?.properties?.NOM_VOIE}{" "}
                      {selectedPlanif.streetFeature?.properties?.TYPE_F}
                    </h3>
                    <p className='text-white/90 text-lg font-medium'>
                      {getEtatDeneigStatus(selectedPlanif.etatDeneig)}
                    </p>
                  </div>
                  <Button
                    onClick={() => setSelectedPlanif(null)}
                    variant='ghost'
                    size='icon'
                    className='text-white hover:bg-white/20 shrink-0'
                  >
                    <span className='text-2xl leading-none'>×</span>
                  </Button>
                </div>

                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                  <div>
                    <p className='text-white/70 text-xs uppercase font-semibold mb-1'>
                      Municipality
                    </p>
                    <p className='text-white font-medium'>
                      {selectedPlanif.streetFeature?.properties?.NOM_VILLE}
                    </p>
                  </div>
                  <div>
                    <p className='text-white/70 text-xs uppercase font-semibold mb-1'>
                      Side
                    </p>
                    <p className='text-white font-medium'>
                      {selectedPlanif.streetFeature?.properties?.COTE}
                    </p>
                  </div>
                  {selectedPlanif.streetFeature?.properties?.DEBUT_ADRESSE && (
                    <div>
                      <p className='text-white/70 text-xs uppercase font-semibold mb-1'>
                        Address Range
                      </p>
                      <p className='text-white font-medium'>
                        {
                          selectedPlanif.streetFeature?.properties
                            ?.DEBUT_ADRESSE
                        }
                        {selectedPlanif.streetFeature?.properties
                          ?.FIN_ADRESSE &&
                          selectedPlanif.streetFeature?.properties
                            ?.FIN_ADRESSE !==
                            selectedPlanif.streetFeature?.properties
                              ?.DEBUT_ADRESSE &&
                          ` - ${selectedPlanif.streetFeature?.properties?.FIN_ADRESSE}`}
                      </p>
                    </div>
                  )}
                  {selectedPlanif.dateMaj && (
                    <div>
                      <p className='text-white/70 text-xs uppercase font-semibold mb-1'>
                        Last Updated
                      </p>
                      <p className='text-white font-medium'>
                        {new Date(selectedPlanif.dateMaj).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
