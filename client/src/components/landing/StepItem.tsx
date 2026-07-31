interface StepItemProps {
  index: number;
  title: string;
  description: string;
}

function StepItem({ index, title, description }: StepItemProps) {
  return (
    <div className="flex gap-4">
      <div
        className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-parchment-100"
        aria-hidden="true"
      >
        {index}
      </div>
      <div className="pt-0.5">
        <h3 className="font-semibold text-navy-950">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">
          {description}
        </p>
      </div>
    </div>
  );
}

export default StepItem;
