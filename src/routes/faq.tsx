import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageSection } from "@/components/anima/page";
import { GlassCard, FadeIn } from "@/components/anima/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({ meta: [{ title: "FAQ — ANIMA Nexus" }, { name: "description", content: "How the digital animal twin works, predictions, supported species, and accuracy." }] }),
  component: FaqPage,
});

const QA: [string, string][] = [
  ["What is a digital animal twin?", "A continuously updated AI profile of an animal that aggregates health, behavior, activity, and risk signals — a living dashboard for that animal."],
  ["How does the AI make predictions?", "We send photos, audio, symptoms, and structured details through Lovable AI gateway models. Outputs are always returned with confidence scores."],
  ["Is the platform for pets only?", "No — pets, shelter animals, livestock, service animals, and wildlife are all first-class."],
  ["Can shelters and conservation teams use it?", "Yes. Shelter intake + adopter matching and the wildlife guardian module are built in."],
  ["How accurate are the predictions?", "Every output carries a confidence score and reasoning. Never act on AI alone for critical decisions — always involve a vet, ranger, or expert."],
  ["How does lost pet matching work?", "Visual features and metadata are compared across reports and sightings; a predictive search radius and ranked matches surface in seconds."],
  ["What data is needed?", "As little as a name and species. More context = stronger predictions."],
  ["Is my data private?", "Your animals and AI history live in your account, scoped by row-level security. Lost reports are intentionally shareable."],
];

function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="FAQ" title={<>Answers to <span className="text-gradient">the obvious questions.</span></>} />
      <PageSection>
        <FadeIn>
          <GlassCard>
            <Accordion type="single" collapsible className="w-full">
              {QA.map(([q, a], i) => (
                <AccordionItem key={i} value={`i-${i}`} className="border-white/10">
                  <AccordionTrigger className="text-left font-display text-base">{q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </GlassCard>
        </FadeIn>
      </PageSection>
    </>
  );
}