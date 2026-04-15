import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface ContactNotificationProps {
  name: string;
  email: string;
  message: string;
  reference?: string;
}

export default function ContactNotification({
  name,
  email,
  message,
  reference,
}: ContactNotificationProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#F7F6F2", margin: 0 }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px" }}>
          <Text style={{ fontSize: "20px", fontWeight: "600", marginBottom: "4px" }}>
            Ny melding — PLKPHOTO
          </Text>
          <Hr style={{ borderColor: "#E5E3DD", margin: "20px 0" }} />

          <Section>
            <Text style={{ fontSize: "12px", color: "#6B6B6B", marginBottom: "2px" }}>FRA</Text>
            <Text style={{ fontSize: "15px", margin: "0 0 16px" }}>
              {name} &lt;{email}&gt;
            </Text>

            {reference && (
              <>
                <Text style={{ fontSize: "12px", color: "#6B6B6B", marginBottom: "2px" }}>
                  BILDEREFERANSE
                </Text>
                <Text style={{ fontSize: "15px", margin: "0 0 16px" }}>{reference}</Text>
              </>
            )}

            <Text style={{ fontSize: "12px", color: "#6B6B6B", marginBottom: "2px" }}>MELDING</Text>
            <Text
              style={{
                fontSize: "15px",
                margin: "0",
                whiteSpace: "pre-wrap",
                lineHeight: "1.6",
              }}
            >
              {message}
            </Text>
          </Section>

          <Hr style={{ borderColor: "#E5E3DD", margin: "24px 0" }} />
          <Text style={{ fontSize: "11px", color: "#6B6B6B" }}>
            Sendt via kontaktskjema på PLKPHOTO
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
