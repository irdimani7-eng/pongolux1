import { ContactForm } from "@/components/contact-form";

export const metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-(family-name:--font-display) text-4xl">
        Contact us
      </h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Questions about an order, a piece you&apos;re eyeing, or a bag you&apos;d
        like to consign? Send us a message and we&apos;ll get back to you
        within one business day.
      </p>

      <div className="mt-10 grid gap-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <ContactForm />
        </div>

        <div className="space-y-8 text-sm">
          <div>
            <h2 className="font-medium">Address</h2>
            <p className="mt-2 text-muted-foreground">Chicago, IL</p>
          </div>
          <div>
            <h2 className="font-medium">Call</h2>
            <p className="mt-2 text-muted-foreground">
              <a href="tel:+13127750792" className="hover:text-accent">
                (312) 775-0792
              </a>
            </p>
          </div>
          <div>
            <h2 className="font-medium">General &amp; Order Support</h2>
            <p className="mt-2 text-muted-foreground">
              <a
                href="mailto:support@pongolux.com"
                className="hover:text-accent"
              >
                support@pongolux.com
              </a>
            </p>
          </div>
          <div>
            <h2 className="font-medium">Marketing &amp; PR</h2>
            <p className="mt-2 text-muted-foreground">
              <a
                href="mailto:press@pongolux.com"
                className="hover:text-accent"
              >
                press@pongolux.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
