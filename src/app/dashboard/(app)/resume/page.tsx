import { ListEditor, ObjectEditor } from "@/components/dashboard/schema-editor";
import { Card, PageHeader } from "@/components/dashboard/ui";
import { getDb } from "@/lib/store";

export default async function ResumePage() {
  const { resume } = await getDb();
  return (
    <>
      <PageHeader title="Résumé" description="Your CV on the site: experience, education, certifications, courses and languages. Upload the PDF version on Profile & logo." />
      <div className="grid gap-4">
        <Card title="Summary">
          <ObjectEditor target="resumeMeta" initial={{ summary: resume.summary, interests: resume.interests }} />
        </Card>
        <Card title="Experience" description="Jobs, internships, freelance work, team projects.">
          <ListEditor target="experience" initial={resume.experience} addLabel="Add role" />
        </Card>
        <Card title="Education">
          <ListEditor target="education" initial={resume.education} addLabel="Add education" />
        </Card>
        <Card title="Certifications" description="Attach the certificate PDF or a verification link to each one.">
          <ListEditor target="certifications" initial={resume.certifications} addLabel="Add certification" emptyText="No certifications yet. Add one and upload its PDF." />
        </Card>
        <Card title="Courses">
          <ListEditor target="courses" initial={resume.courses} addLabel="Add course" />
        </Card>
        <Card title="Languages">
          <ListEditor target="languages" initial={resume.languages} addLabel="Add language" />
        </Card>
      </div>
    </>
  );
}
