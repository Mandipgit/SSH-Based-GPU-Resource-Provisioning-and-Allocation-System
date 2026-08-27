"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { Cpu, Menu, X, LayoutDashboard, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import "./PillNav.css";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "For Hosts", href: "/register/host" },
];

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function PillNav() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const isMounted = useIsMounted();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs for GSAP animations
  const navContainerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const logoIconRef = useRef<HTMLDivElement>(null);
  const linksTrackRef = useRef<HTMLDivElement>(null);
  const hoverCircleRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);
  const mobileItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  // Keep track of active item element
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  // Helper to check if route is active
  const isRouteActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/how-it-works") {
      return pathname === "/how-it-works" || pathname === "/#how-it-works";
    }
    return pathname.startsWith(href);
  };

  // 1. Initial Logo & Nav Reveal Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Nav Container Reveal
      if (navContainerRef.current) {
        gsap.fromTo(
          navContainerRef.current,
          { y: -30, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" }
        );
      }

      // Initial Logo Entrance Animation
      if (logoRef.current) {
        gsap.fromTo(
          logoRef.current,
          { opacity: 0, x: -15 },
          { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", delay: 0.2 }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // 2. Position Hover Indicator on Active Route or Mount
  useEffect(() => {
    if (!linksTrackRef.current || !hoverCircleRef.current) return;

    // Find active element
    const links = linksTrackRef.current.querySelectorAll<HTMLAnchorElement>(".pill-nav-item");
    let foundActive: HTMLAnchorElement | null = null;

    for (const link of Array.from(links)) {
      const href = link.getAttribute("data-href");
      if (href && isRouteActive(href)) {
        foundActive = link;
        break;
      }
    }

    activeItemRef.current = foundActive;

    if (foundActive) {
      const trackRect = linksTrackRef.current.getBoundingClientRect();
      const activeRect = (foundActive as HTMLAnchorElement).getBoundingClientRect();
      const x = activeRect.left - trackRect.left;
      const width = activeRect.width;

      gsap.to(hoverCircleRef.current, {
        x,
        width,
        opacity: 1,
        duration: 0.4,
        ease: "power2.out",
      });
    } else {
      gsap.to(hoverCircleRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  }, [pathname]);

  // 3. Pill Hover Animation
  const handleItemMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!linksTrackRef.current || !hoverCircleRef.current) return;

    const trackRect = linksTrackRef.current.getBoundingClientRect();
    const itemRect = e.currentTarget.getBoundingClientRect();
    const x = itemRect.left - trackRect.left;
    const width = itemRect.width;

    gsap.to(hoverCircleRef.current, {
      x,
      width,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleTrackMouseLeave = () => {
    if (!linksTrackRef.current || !hoverCircleRef.current) return;

    if (activeItemRef.current) {
      const trackRect = linksTrackRef.current.getBoundingClientRect();
      const activeRect = activeItemRef.current.getBoundingClientRect();
      const x = activeRect.left - trackRect.left;
      const width = activeRect.width;

      gsap.to(hoverCircleRef.current, {
        x,
        width,
        opacity: 1,
        duration: 0.35,
        ease: "power2.out",
      });
    } else {
      gsap.to(hoverCircleRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
      });
    }
  };

  // 4. Logo Rotation Animation on Hover
  const handleLogoMouseEnter = () => {
    if (logoIconRef.current) {
      gsap.to(logoIconRef.current, {
        rotation: "+=360",
        duration: 0.6,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  // 5. Mobile Menu GSAP Animation
  useEffect(() => {
    if (!mobileSheetRef.current) return;

    if (mobileMenuOpen) {
      const validItems = mobileItemsRef.current.filter(Boolean);
      gsap.killTweensOf([mobileSheetRef.current, ...validItems]);

      const tl = gsap.timeline();
      tl.fromTo(
        mobileSheetRef.current,
        { opacity: 0, y: -15, scale: 0.96, display: "none" },
        { opacity: 1, y: 0, scale: 1, display: "flex", duration: 0.35, ease: "power3.out" }
      ).fromTo(
        validItems,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, stagger: 0.04, duration: 0.25, ease: "power2.out" },
        "-=0.2"
      );
    } else {
      gsap.to(mobileSheetRef.current, {
        opacity: 0,
        y: -10,
        scale: 0.97,
        duration: 0.25,
        ease: "power2.in",
        onComplete: () => {
          if (mobileSheetRef.current) {
            mobileSheetRef.current.style.display = "none";
          }
        },
      });
    }
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="pill-nav-wrapper">
      <div ref={navContainerRef} className="pill-nav-container">
        {/* Brand / Logo */}
        <Link
          href="/"
          ref={logoRef}
          onMouseEnter={handleLogoMouseEnter}
          className="flex items-center gap-2.5 px-2 py-1 group select-none text-decoration-none"
        >
          <div
            ref={logoIconRef}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow duration-300"
          >
            <Cpu className="h-4 w-4" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white transition-colors duration-200">
            tero gpu de malai
          </span>
        </Link>

        {/* Desktop Nav Items Track */}
        <nav
          ref={linksTrackRef}
          onMouseLeave={handleTrackMouseLeave}
          className="pill-nav-links-track hidden md:flex"
        >
          {/* Animated Hover & Active Indicator Circle/Pill */}
          <div ref={hoverCircleRef} className="pill-hover-circle" />

          {NAV_ITEMS.map((item) => {
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-href={item.href}
                onMouseEnter={handleItemMouseEnter}
                className={`pill-nav-item ${active ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / Auth Section (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          {isMounted && isAuthenticated ? (
            <Link href="/dashboard" className="pill-nav-cta">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard ({user?.name?.split(" ")[0] || "Account"})</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm font-medium px-3 py-1.5 rounded-full transition-colors duration-150 ${
                  pathname.startsWith("/login")
                    ? "text-white bg-white/10 font-semibold"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                Login
              </Link>
              <Link href="/register" className="pill-nav-cta">
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          {isMounted && isAuthenticated && (
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30"
            >
              Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-full text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors focus:outline-none"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown Sheet */}
        <div
          ref={mobileSheetRef}
          className="pill-mobile-sheet md:hidden"
          style={{ display: "none" }}
        >
          {NAV_ITEMS.map((item, index) => {
            const active = isRouteActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => {
                  mobileItemsRef.current[index] = el;
                }}
                className={`pill-mobile-item ${active ? "is-active" : ""}`}
              >
                <span>{item.label}</span>
                <ArrowRight className="w-4 h-4 opacity-50" />
              </Link>
            );
          })}

          <div className="pt-2 mt-1 border-t border-white/10 flex flex-col gap-2">
            {isMounted && isAuthenticated ? (
              <Link
                href="/dashboard"
                ref={(el) => {
                  mobileItemsRef.current[NAV_ITEMS.length] = el;
                }}
                className="pill-nav-cta w-full justify-center py-2.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  ref={(el) => {
                    mobileItemsRef.current[NAV_ITEMS.length] = el;
                  }}
                  className={`pill-mobile-item justify-center ${
                    pathname.startsWith("/login") ? "is-active" : ""
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  ref={(el) => {
                    mobileItemsRef.current[NAV_ITEMS.length + 1] = el;
                  }}
                  className="pill-nav-cta w-full justify-center py-2.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
export default PillNav;
