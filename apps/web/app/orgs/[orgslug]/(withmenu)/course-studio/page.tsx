import CourseStudio from './course-studio'

export default async function CourseStudioPage(props: { params: Promise<{ orgslug: string }> }) {
  const { orgslug } = await props.params
  return <CourseStudio orgslug={orgslug} />
}
