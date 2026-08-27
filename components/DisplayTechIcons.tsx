import { cn, getTechLogos } from "@/lib/utils";
import Image from "next/image";

const DisplayTechIcons = ({ techStack }: TechIconProps) => {
  const techIcons = getTechLogos(techStack);

  return (
    <div className="flex flex-row">
      {techIcons.slice(0, 3).map(({ tech, url }, index) => (
        <div
          key={tech}
          className={cn(
            "relative group flex-center rounded-full bg-dark-300 p-2",
            index >= 1 && "-ml-3"
          )}
        >
          <span className="tech-tooltip">{tech}</span>
          <Image src={url} alt={tech} width={100} height={100} className="size-5" />
        </div>
      ))}
    </div>
  );
};

export default DisplayTechIcons;
