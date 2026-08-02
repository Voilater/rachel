import { allCatalogProducts } from "@/lib/site-data";

/** Routes to prerender for S3 / CloudFront static hosting. */
export function getStaticPrerenderRoutes(): string[] {
  const pages = [
    "/",
    "/shop",
    "/customize",
    "/philosophy",
    "/contact",
    "/cart",
    "/login",
    "/signup",
    "/location",
    "/lifestyle",
    "/overview",
    "/checkout",
    "/checkout/success",
  ];

  const products = allCatalogProducts.map((p) => `/shop/${p.id}`);

  return [...pages, ...products];
}
