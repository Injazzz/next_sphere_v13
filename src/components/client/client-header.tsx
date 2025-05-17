import React from "react";

const CLientHeader = () => {
  return (
    <div className='w-full flex justify-between'>
      <div className='flex flex-col gap-2 sm:gap-4'>
        <h1 className='text-3xl font-semibold'>Clients Table</h1>
        <p className='text-muted-foreground text-sm max-w-4xl w-full'>
          The following table provides a structured overview of registered
          client information, essential for identification, communication, and
          relationship management.
        </p>
      </div>
    </div>
  );
};

export default CLientHeader;
