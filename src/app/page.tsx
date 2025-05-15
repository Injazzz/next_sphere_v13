import { GetStartedButton } from "@/components/ui/get-started-button";
import { ModeToggle } from "@/components/ui/toggle-mode";

export default function Page() {
  return (
    <div className='w-full h-svh flex flex-col gap-4 justify-center items-center'>
      <h1 className='text-5xl font-bold font-pacifico'> Hello World</h1>
      <ModeToggle />
      <GetStartedButton />
    </div>
  );
}
