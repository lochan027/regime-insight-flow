import { motion } from "framer-motion";
import { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div id={id} className={`mb-10 md:mb-14 ${align === "center" ? "text-center mx-auto max-w-2xl" : "max-w-3xl"}`}>
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border hairline bg-surface-2/60 px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted-foreground"
        >
          <span className="live-dot" />
          {eyebrow}
        </motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="mt-4 text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground"
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed"
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
