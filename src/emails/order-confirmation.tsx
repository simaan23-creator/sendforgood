import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface OrderConfirmationEmailProps {
  recipientName: string;
  occasionType: string;
  tier: string;
  years: number;
  totalAmount: number;
}

export default function OrderConfirmationEmail({
  recipientName = "Friend",
  occasionType = "birthday",
  tier = "premium",
  years = 5,
  totalAmount = 39500,
}: OrderConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your SendForGood gift plan is confirmed!</Preview>
      <Body style={{ backgroundColor: "#FDF8F0", fontFamily: "Inter, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}>
          <Heading style={{ color: "#1B2A4A", fontSize: "28px", textAlign: "center" as const, marginBottom: "8px" }}>
            Your Gift Plan is Set! 🎁
          </Heading>
          <Text style={{ color: "#6B5E50", fontSize: "16px", textAlign: "center" as const, marginBottom: "32px" }}>
            Thank you for choosing SendForGood. Your love will keep arriving, year after year.
          </Text>
          <Section style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #F5EDE0" }}>
            <Text style={{ color: "#1B2A4A", fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
              Plan Summary
            </Text>
            <Text style={{ color: "#6B5E50", fontSize: "14px", margin: "8px 0" }}>
              <strong style={{ color: "#1B2A4A" }}>Recipient:</strong> {recipientName}
            </Text>
            <Text style={{ color: "#6B5E50", fontSize: "14px", margin: "8px 0" }}>
              <strong style={{ color: "#1B2A4A" }}>Occasion:</strong> {occasionType}
            </Text>
            <Text style={{ color: "#6B5E50", fontSize: "14px", margin: "8px 0" }}>
              <strong style={{ color: "#1B2A4A" }}>Tier:</strong> {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </Text>
            <Text style={{ color: "#6B5E50", fontSize: "14px", margin: "8px 0" }}>
              <strong style={{ color: "#1B2A4A" }}>Duration:</strong> {years} year{years > 1 ? "s" : ""}
            </Text>
            <Hr style={{ borderColor: "#F5EDE0", margin: "16px 0" }} />
            <Text style={{ color: "#1B2A4A", fontSize: "18px", fontWeight: "600", textAlign: "right" as const }}>
              Total: ${(totalAmount / 100).toFixed(2)}
            </Text>
          </Section>
          <Text style={{ color: "#6B5E50", fontSize: "14px", textAlign: "center" as const, marginTop: "32px" }}>
            We&apos;ll take care of everything from here. Your first gift will be curated and delivered right on time.
          </Text>
          <Hr style={{ borderColor: "#F5EDE0", margin: "32px 0" }} />
          <Text style={{ color: "#9B8E80", fontSize: "12px", textAlign: "center" as const }}>
            SendForGood — Legacy giving, made simple.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
