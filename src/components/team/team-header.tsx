const TeamHeader = () => {
  return (
    <div className='w-full flex justify-between'>
      <div className='flex flex-col gap-2 sm:gap-4'>
        <h1 className='text-3xl font-semibold'>Team</h1>
        <p className='text-md max-w-4xl w-full'>
          &quot;Alone we can do so little, together we can do so much.&quot; -
          This Helen Keller quote embodies team philosophy.
        </p>

        <p className='text-md max-w-4xl w-full'>Getting Started is Easy:</p>
        <ol className='text-md max-w-4xl w-full'>
          <li className='flex gap-3'>
            1. <span>Create Your Team - Set up your dedicated workspace</span>
          </li>
          <li className='flex gap-2'>
            2.{" "}
            <span>
              Assign Roles - Choose your team leader and define responsibilities
            </span>
          </li>
          <li className='flex gap-2'>
            3.{" "}
            <span>
              Bring Members Onboard - Invite colleagues to contribute Start
            </span>
          </li>
          <li className='flex gap-2'>
            4.{" "}
            <span>Collaborating - Initiate projects and work collectively</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default TeamHeader;
