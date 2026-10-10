import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = {
  title: "Size guide",
  description:
    "Find your perfect basketball shoe fit. US sizing chart, measurement instructions, and fit tips for hoopers, gymnasts, and everyday wear.",
  alternates: { canonical: "/size-guide" },
};

const CHART = [
  { us: "7", uk: "6", eu: "40", cm: "25.0" },
  { us: "7.5", uk: "6.5", eu: "40.5", cm: "25.5" },
  { us: "8", uk: "7", eu: "41", cm: "26.0" },
  { us: "8.5", uk: "7.5", eu: "42", cm: "26.5" },
  { us: "9", uk: "8", eu: "42.5", cm: "27.0" },
  { us: "9.5", uk: "8.5", eu: "43", cm: "27.5" },
  { us: "10", uk: "9", eu: "44", cm: "28.0" },
  { us: "10.5", uk: "9.5", eu: "44.5", cm: "28.5" },
  { us: "11", uk: "10", eu: "45", cm: "29.0" },
  { us: "11.5", uk: "10.5", eu: "45.5", cm: "29.5" },
  { us: "12", uk: "11", eu: "46", cm: "30.0" },
  { us: "13", uk: "12", eu: "47.5", cm: "31.0" },
  { us: "14", uk: "13", eu: "48.5", cm: "32.0" },
];

export default function SizeGuidePage() {
  return (
    <div className="container-page py-12">
      <header className="max-w-2xl">
        <p className="eyebrow">Fit & sizing</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Size guide</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          Our shoes run true to size for most feet. If you are between sizes or
          have a wide foot, we recommend going up half a size — especially for
          basketball, where a little extra room keeps toes safe on hard stops.
        </p>
      </header>

      <section aria-labelledby="chart-heading" className="mt-10">
        <h2 id="chart-heading" className="text-xl font-bold">
          Unisex sizing chart
        </h2>
        <div className="mt-4 overflow-x-auto rounded-md border border-line bg-surface">
          <table className="w-full min-w-[520px] text-left text-[14px]">
            <caption className="sr-only">
              Shoe size conversion chart in US, UK, EU, and centimeters
            </caption>
            <thead>
              <tr className="border-b border-line bg-paper text-[12px] uppercase tracking-wider text-muted">
                <th scope="col" className="px-5 py-3 font-semibold">US</th>
                <th scope="col" className="px-5 py-3 font-semibold">UK</th>
                <th scope="col" className="px-5 py-3 font-semibold">EU</th>
                <th scope="col" className="px-5 py-3 font-semibold">Foot length (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {CHART.map((row) => (
                <tr key={row.us} className="table-row-hover">
                  <td className="px-5 py-2.5 font-semibold">{row.us}</td>
                  <td className="px-5 py-2.5 text-muted">{row.uk}</td>
                  <td className="px-5 py-2.5 text-muted">{row.eu}</td>
                  <td className="px-5 py-2.5 text-muted">{row.cm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="measure-heading" className="mt-12 max-w-2xl">
        <h2 id="measure-heading" className="text-xl font-bold">
          How to measure your foot
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-[15px] leading-relaxed text-muted">
          <li>
            Place a piece of paper against a wall and stand on it with your heel
            touching the wall.
          </li>
          <li>
            Mark the longest toe, then measure from the wall to the mark in
            centimeters.
          </li>
          <li>
            Match the measurement to the “Foot length” column above. If you land
            between two rows, choose the larger size.
          </li>
          <li>
            Measure both feet — sizes can differ. Fit the larger foot.
          </li>
        </ol>
      </section>

      <section aria-labelledby="fit-heading" className="mt-12 max-w-2xl">
        <h2 id="fit-heading" className="text-xl font-bold">
          Fit notes by activity
        </h2>
        <dl className="mt-4 space-y-4 text-[14.5px]">
          <div>
            <dt className="font-semibold text-ink">Basketball</dt>
            <dd className="mt-1 text-muted">
              Snug but not tight. Your heel should lock in with a thumb&apos;s
              width of space at the toe. Break in gradually before game day.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Gymnastics & studio</dt>
            <dd className="mt-1 text-muted">
              A closer fit helps with precision. If you wear thin socks or train
              barefoot-style, consider half a size down from your street size.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink">Everyday / lifestyle</dt>
            <dd className="mt-1 text-muted">
              True to size for most. Wide feet should size up half a size.
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-10 max-w-2xl">
        <Notice tone="info" title="Still unsure?">
          Tell us your usual size and activity at{" "}
          <Link href="/contact" className="font-semibold underline">
            the contact page
          </Link>{" "}
          and we will recommend a fit before you order.
        </Notice>
      </div>
    </div>
  );
}
