import { Star } from "lucide-react";

import type { Testimonial } from "@/lib/site-data";

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-8 shadow-md shadow-burgundy/5">
      <div className="flex gap-1 text-burgundy">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-burgundy text-burgundy" />
        ))}
      </div>
      <blockquote className="mt-5 font-serif text-lg italic leading-relaxed text-foreground/90">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <div className="mt-6 flex items-center gap-3">
        <img
          src={testimonial.avatar}
          alt=""
          className="size-11 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-burgundy">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
        </div>
      </div>
    </article>
  );
}
