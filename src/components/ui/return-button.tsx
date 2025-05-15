import React from "react";
import { Button } from "./button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ReturnButtonProps {
  href: string;
  label: string;
}

export default function ReturnButton({ href, label }: ReturnButtonProps) {
  return (
    <Button size='sm' asChild variant='ghost'>
      <Link href={href} className='flex gap-2 items-center'>
        <ArrowLeft />
        <span>{label}</span>
      </Link>
    </Button>
  );
}
