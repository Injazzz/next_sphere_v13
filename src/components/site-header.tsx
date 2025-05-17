"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./ui/toggle-mode";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ text: string; url: string; isLast: boolean; originalText: string }>
  >([]);
  const [hiddenPaths, setHiddenPaths] = useState<
    Array<{ text: string; url: string; isLast: boolean }>
  >([]);

  // Fungsi untuk memformat teks breadcrumb
  const formatBreadcrumbText = (text: string) => {
    if (text.length <= 10) return text;
    return `${text.slice(0, 2)}...${text.slice(-3)}`;
  };

  useEffect(() => {
    const generateBreadcrumbs = () => {
      if (!pathname) return;

      const pathSegments = pathname.split("/").filter((segment) => segment);

      const items = pathSegments.map((segment, index) => {
        const url = "/" + pathSegments.slice(0, index + 1).join("/");
        const formattedSegment = segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        return {
          text: formatBreadcrumbText(formattedSegment),
          originalText: formattedSegment, // Simpan teks asli untuk tooltip
          url: url,
          isLast: index === pathSegments.length - 1,
        };
      });

      if (items.length > 4) {
        const hiddenItems = items.slice(1, items.length - 2);
        setHiddenPaths(hiddenItems);
        setBreadcrumbs([items[0], ...items.slice(items.length - 2)]);
      } else {
        setHiddenPaths([]);
        setBreadcrumbs(items);
      }
    };

    generateBreadcrumbs();
  }, [pathname]);

  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator
          orientation='vertical'
          className='mx-2 data-[orientation=vertical]:h-4'
        />

        {/* Breadcrumb navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbSeparator>
              <ChevronRight className='h-4 w-4' />
            </BreadcrumbSeparator>

            {/* Dynamic breadcrumbs */}
            {breadcrumbs.map((crumb, index) => (
              <BreadcrumbItem key={index}>
                {index > 0 && index === 1 && hiddenPaths.length > 0 && (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger className='flex items-center gap-1'>
                        <BreadcrumbEllipsis className='h-4 w-4' />
                        <span className='sr-only'>Hidden paths</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='start'>
                        {hiddenPaths.map((hidden, i) => (
                          <DropdownMenuItem key={i}>
                            <a href={hidden.url}>{hidden.text}</a>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <BreadcrumbSeparator>
                      <ChevronRight className='h-4 w-4' />
                    </BreadcrumbSeparator>
                  </>
                )}

                {/* Show breadcrumb as link or current page */}
                {crumb.isLast ? (
                  <BreadcrumbPage title={crumb.originalText}>
                    {crumb.text}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.url} title={crumb.originalText}>
                    {crumb.text}
                  </BreadcrumbLink>
                )}

                {/* Add separator between breadcrumbs */}
                {!crumb.isLast && (
                  <BreadcrumbSeparator>
                    <ChevronRight className='h-4 w-4' />
                  </BreadcrumbSeparator>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className='ml-auto flex items-center gap-2'>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
