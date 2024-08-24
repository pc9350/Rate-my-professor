// components/ProfessorList.js
import Link from 'next/link';

export default function ProfessorList({ professors }) {
  return (
    <ul>
      {professors.map((professor) => (
        <li key={professor.id}>
          <Link href={`/professor/${professor.id}`}>
            {professor.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
