import ReturnButton from "@/components/ui/return-button";
import React from "react";

const Page = () => {
  return (
    <div className='w-full h-svh flex items-center justify-center'>
      <div className='flex flex-col justify-center h-72 border p-5 gap-5'>
        <ReturnButton href='/login' label='Back to login' />
        it&apos;s look like your email already taken
      </div>
    </div>
  );
};

export default Page;
