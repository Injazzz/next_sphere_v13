import CLientHeader from "@/components/client/client-header";
import { ClientListTable } from "@/components/client/client-list-table";

export default function Page() {
  return (
    <div className='w-full flex flex-col gap-4'>
      <CLientHeader />
      <ClientListTable />
    </div>
  );
}
