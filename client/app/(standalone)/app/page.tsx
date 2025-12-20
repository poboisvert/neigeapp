"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentControl } from "@/components/ui/segment-control";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Snowflake,
  RefreshCw,
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
  Car,
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
  }>({ lat: 45.5019, lng: -73.5674, zoom: 16 });
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
  const [parkingLocations, setParkingLocations] = useState<any[]>([]);
  const [showParkingDialog, setShowParkingDialog] = useState(false);
  const [clickedParkingLocation, setClickedParkingLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [parkingName, setParkingName] = useState("");
  const [parkingNotes, setParkingNotes] = useState("");
  const [parkingModeEnabled, setParkingModeEnabled] = useState(false);
  const [selectedParkingLocationId, setSelectedParkingLocationId] = useState<
    string | null
  >(null);
  const [showParkingMessage, setShowParkingMessage] = useState(false);

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

          // If bounds are provided, replace with only the data from the API (viewport data)
          // Otherwise, replace all data (initial load)
          setPlanifications(transformedData);
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
        .select("cote_rue_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error loading favorites:", error);
        throw error;
      }

      const favoriteIds = new Set(data?.map((f) => f.cote_rue_id) || []);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error("Error loading favorites:", error);
    }
  };

  // Load favorite planifications with full street data
  const loadFavoritePlanifications = useCallback(async () => {
    if (!user || favorites.size === 0) {
      return [];
    }

    try {
      const favoriteIds = Array.from(favorites);

      const { data, error } = await supabase
        .from("streets")
        .select(
          `*,
          deneigement_current (
            etat_deneig,
            status,
            date_debut_planif,
            date_fin_planif,
            date_debut_replanif,
            date_fin_replanif,
            date_maj
          )`
        )
        .in("cote_rue_id", favoriteIds);

      if (error) {
        console.error("Error loading favorite planifications:", error);
        throw error;
      }

      if (!data) return [];

      return data
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
          isFavorite: true, // Mark as favorite
        }));
    } catch (error) {
      console.error("Error loading favorite planifications:", error);
      return [];
    }
  }, [user, favorites]);

  const toggleFavorite = async (coteRueId: number) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (favorites.has(coteRueId)) {
        // Remove from favorites
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("cote_rue_id", coteRueId)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error removing favorite:", error);
          throw error;
        }

        setFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(coteRueId);
          return newSet;
        });
      } else {
        // Add to favorites
        const { error } = await supabase.from("user_favorites").insert({
          cote_rue_id: coteRueId,
          user_id: user.id,
        });

        if (error) {
          console.error("Error adding favorite:", error);
          // Check if it's a duplicate key error (already favorited)
          if (error.code === "23505") {
            // Already exists, just update local state
            setFavorites((prev) => new Set(prev).add(coteRueId));
            return;
          }
          throw error;
        }

        setFavorites((prev) => new Set(prev).add(coteRueId));
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Optionally show a toast notification to the user
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
    loadFavorites();
    loadParkingLocations();
  }, [user]);

  const loadParkingLocations = async () => {
    if (!user) {
      setParkingLocations([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("parking_locations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading parking locations:", error);
        throw error;
      }

      setParkingLocations(data || []);
    } catch (error) {
      console.error("Error loading parking locations:", error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Only handle map click if parking mode is enabled
    if (!parkingModeEnabled) return;

    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setClickedParkingLocation({ lat, lng });
    setParkingName("");
    setParkingNotes("");
    setShowParkingDialog(true);
  };

  const saveParkingLocation = async () => {
    if (!user || !clickedParkingLocation) return;

    try {
      const { data, error } = await supabase
        .from("parking_locations")
        .insert({
          user_id: user.id,
          latitude: clickedParkingLocation.lat,
          longitude: clickedParkingLocation.lng,
          name: parkingName || null,
          notes: parkingNotes || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving parking location:", error);
        throw error;
      }

      setParkingLocations((prev) => [data, ...prev]);
      setShowParkingDialog(false);
      setClickedParkingLocation(null);
      setParkingName("");
      setParkingNotes("");
      setParkingModeEnabled(false);
    } catch (error) {
      console.error("Error saving parking location:", error);
    }
  };

  const deleteParkingLocation = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("parking_locations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting parking location:", error);
        throw error;
      }

      setParkingLocations((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting parking location:", error);
    }
  };

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

  // State to hold favorite planifications
  const [favoritePlanifications, setFavoritePlanifications] = useState<any[]>(
    []
  );

  // Load favorite planifications when favorites change
  useEffect(() => {
    if (user && favorites.size > 0) {
      loadFavoritePlanifications().then((favPlanifs) => {
        setFavoritePlanifications(favPlanifs);
      });
    } else {
      setFavoritePlanifications([]);
    }
  }, [user, favorites, loadFavoritePlanifications]);

  // Merge viewport planifications with favorites, avoiding duplicates
  const mergedPlanifications = useMemo(() => {
    const viewportIds = new Set(planifications.map((p: any) => p.coteRueId));

    // Combine viewport data with favorites that aren't already in viewport
    const combined = [...planifications];

    favoritePlanifications.forEach((favPlanif: any) => {
      if (!viewportIds.has(favPlanif.coteRueId)) {
        combined.push(favPlanif);
      }
    });

    return combined;
  }, [planifications, favoritePlanifications]);

  const filteredPlanifications = useMemo(() => {
    if (filterMode === "favorites") {
      const favoriteStreets = mergedPlanifications.filter((p: any) =>
        favorites.has(p.coteRueId)
      );

      // Add parking locations to favorites view
      const parkingItems = parkingLocations.map((parking: any) => ({
        id: `parking-${parking.id}`,
        type: "parking",
        parking: parking,
      }));

      return [...favoriteStreets, ...parkingItems];
    }
    return mergedPlanifications;
  }, [mergedPlanifications, filterMode, favorites, parkingLocations]);

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

        <div className='flex items-center gap-1 flex-1'>
          <h1
            className={`text-2xl ${
              darkMode ? "text-gray-100" : "text-gray-900"
            } flex items-baseline`}
          >
            <span className='font-patrick-hand text-3xl'>Neige.app</span>
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
              {filteredPlanifications.length}{" "}
              {filteredPlanifications.length === 1 ? "item" : "items"}
              {filterMode === "favorites" && " (favorites & parking)"}
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
              {filteredPlanifications.map((item: any, index: number) => {
                // Handle parking locations
                if (item.type === "parking") {
                  const parking = item.parking;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border transition-all relative ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 hover:bg-blue-900/20 hover:border-blue-500"
                          : "bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              "Are you sure you want to delete this parking location?"
                            )
                          ) {
                            deleteParkingLocation(parking.id);
                          }
                        }}
                        className={`absolute top-2 right-2 p-1 rounded-full ${
                          darkMode ? "hover:bg-gray-600" : "hover:bg-gray-200"
                        } transition-colors`}
                        title='Delete parking location'
                      >
                        <X className='h-4 w-4 text-gray-400 hover:text-red-500' />
                      </button>
                      <div
                        className='space-y-1 pr-8 cursor-pointer'
                        onClick={() => {
                          // Zoom to parking location and select it
                          setSearchLocation(null); // Clear search location to avoid showing search marker
                          setSelectedParkingLocationId(parking.id);
                          // Set search location for zooming, but clear it after a moment so parking popup shows
                          setSearchLocation({
                            lat: parking.latitude,
                            lng: parking.longitude,
                            zoom: 18,
                          });
                          // Clear search location after map has zoomed so parking popup shows
                          setTimeout(() => {
                            setSearchLocation(null);
                          }, 500);
                          setSidebarOpen(false);
                        }}
                      >
                        <div className='flex items-center gap-2'>
                          <div
                            className={`flex items-center justify-center w-6 h-6 rounded-full ${
                              darkMode ? "bg-blue-600" : "bg-blue-500"
                            } text-white text-xs font-bold`}
                          >
                            P
                          </div>
                          <p
                            className={`font-medium text-sm ${
                              darkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {parking.name || "Parking Location"}
                          </p>
                        </div>
                        {parking.notes && (
                          <p
                            className={`text-xs ${
                              darkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {parking.notes}
                          </p>
                        )}
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {parking.latitude.toFixed(5)},{" "}
                          {parking.longitude.toFixed(5)}
                        </p>
                        <p
                          className={`text-xs ${
                            darkMode ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          {new Date(parking.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Handle regular planifications
                const planif = item;
                return (
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
                );
              })}
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
          {/* Parking Mode Toggle Button */}
          <div className='absolute top-4 right-4 z-10'>
            <Button
              onClick={() => {
                const newValue = !parkingModeEnabled;
                setParkingModeEnabled(newValue);
                if (newValue) {
                  // Show message for 5 seconds when parking mode is enabled
                  setShowParkingMessage(true);
                  setTimeout(() => {
                    setShowParkingMessage(false);
                  }, 5000);
                }
              }}
              className={`shadow-lg transition-all ${
                parkingModeEnabled
                  ? "bg-[#22c55e] hover:bg-[#16a34a] text-white"
                  : "bg-[#6b7280] hover:bg-[#4b5563] text-white"
              }`}
              size='icon'
              title={
                parkingModeEnabled
                  ? "Click map to save parking location (Click again to disable)"
                  : "Enable parking location saving"
              }
            >
              <Car className='h-5 w-5' />
            </Button>
          </div>

          {/* Parking Mode Message */}
          {showParkingMessage && (
            <div className='absolute top-20 right-4 z-20 animate-in fade-in slide-in-from-top-2'>
              <div
                className={`rounded-lg shadow-lg px-4 py-3 ${
                  darkMode
                    ? "bg-[#22c55e] text-white"
                    : "bg-[#22c55e] text-white"
                }`}
              >
                <p className='text-sm font-medium'>
                  Veuillez cliquer sur la carte pour enregistrer le
                  stationnement
                </p>
              </div>
            </div>
          )}
          <div className='absolute top-4 left-4 right-20 md:left-1/2 md:-translate-x-1/2 md:right-auto z-10 md:w-full md:max-w-md'>
            <form onSubmit={handleSearch} className='relative search-container'>
              <div className='relative'>
                <Input
                  type='text'
                  placeholder='Search address in Montreal...'
                  value={searchQuery}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  onFocus={() =>
                    searchSuggestions.length > 0 && setShowSuggestions(true)
                  }
                  className={`shadow-lg pr-10 w-full ${
                    darkMode
                      ? "bg-gray-800 border-gray-600 text-gray-100 placeholder:text-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
                  }`}
                />
                <Search
                  className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 ${
                    darkMode ? "text-gray-400" : "text-gray-500"
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
            </form>
          </div>

          <pre className='text-xs py-2 px-3 bg-gray-800 text-gray-100 rounded mb-2'>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            <br></br>
            {JSON.stringify(initialCenter, null, 2)}
          </pre>
          {initialCenter ? (
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
              onMapClick={handleMapClick}
              parkingLocations={parkingLocations}
              onParkingLocationDelete={deleteParkingLocation}
              selectedParkingLocationId={selectedParkingLocationId}
            />
          ) : (
            <div className='relative w-full h-full'>
              <Skeleton
                className={`w-full h-full ${
                  darkMode ? "bg-gray-800" : "bg-gray-100"
                }`}
              />
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-4'>
                <div className='flex flex-col items-center gap-2'>
                  <MapPin
                    className={`h-8 w-8 ${
                      darkMode ? "text-gray-600" : "text-gray-400"
                    } animate-pulse`}
                  />
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Loading map...
                  </p>
                </div>
              </div>
            </div>
          )}

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

          {/* Parking Location Dialog */}
          <Dialog open={showParkingDialog} onOpenChange={setShowParkingDialog}>
            <DialogContent className={darkMode ? "bg-gray-800" : ""}>
              <DialogHeader>
                <DialogTitle className={darkMode ? "text-gray-100" : ""}>
                  Save Parking Location
                </DialogTitle>
                <DialogDescription className={darkMode ? "text-gray-400" : ""}>
                  Click on the map to mark where you parked your car. Add a name
                  and notes to help you remember.
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4 py-4'>
                {clickedParkingLocation && (
                  <div className='space-y-2'>
                    <p
                      className={`text-sm ${
                        darkMode ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Location: {clickedParkingLocation.lat.toFixed(5)},{" "}
                      {clickedParkingLocation.lng.toFixed(5)}
                    </p>
                    <Input
                      placeholder='Parking location name (optional)'
                      value={parkingName}
                      onChange={(e) => setParkingName(e.target.value)}
                      className={
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : ""
                      }
                    />
                    <Textarea
                      placeholder='Notes (optional)'
                      value={parkingNotes}
                      onChange={(e) => setParkingNotes(e.target.value)}
                      rows={3}
                      className={
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : ""
                      }
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowParkingDialog(false);
                    setClickedParkingLocation(null);
                    setParkingName("");
                    setParkingNotes("");
                  }}
                  className={
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                      : ""
                  }
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveParkingLocation}
                  className='bg-blue-600 hover:bg-blue-700 text-white'
                >
                  Save Parking Location
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
