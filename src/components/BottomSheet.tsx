type BottomSheetProps = {
  title: string;
  children: React.ReactNode;
};

export function BottomSheet({ title, children }: BottomSheetProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 lg:hidden">
      <div className="mx-3 mb-3 rounded-t-3xl bg-white shadow-2xl border border-gray-200">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
          <div className="text-sm font-semibold">{title}</div>
          <div className="w-10" />
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}





