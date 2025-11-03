import FileTree from '@/components/FileTree'

export default function Home() {
  const treeStructure = {
    name: 'Autodidacticism',
    path: '/',
    children: [
      {
        name: 'About',
        path: '/about',
        children: [
          {
            name: 'preface',
            path: '/about/preface',
          },
        ],
      },
      {
        name: 'Architecture',
        path: '/architecture',
        children: [
          {
            name: 'preface',
            path: '/architecture/preface',
          },
        ],
      },
      {
        name: 'Economics',
        path: '/economics',
        children: [
          {
            name: 'preface',
            path: '/economics/preface',
          },
        ],
      },
      {
        name: 'Film',
        path: '/film',
        children: [
          {
            name: 'preface',
            path: '/film/preface',
          },
        ],
      },
      {
        name: 'History',
        path: '/history',
        children: [
          {
            name: 'preface',
            path: '/history/preface',
          },
        ],
      },
      {
        name: 'Music',
        path: '/music',
        children: [
          {
            name: 'preface',
            path: '/music/preface',
          },
        ],
      },
      {
        name: 'Philosophy',
        path: '/philosophy',
        children: [
          {
            name: 'preface',
            path: '/philosophy/preface',
          },
        ],
      },
      {
        name: 'Politics',
        path: '/politics',
        children: [
          {
            name: 'preface',
            path: '/politics/preface',
          },
        ],
      },
      {
        name: 'Theology',
        path: '/theology',
        children: [
          {
            name: 'preface',
            path: '/theology/preface',
          },
        ],
      },
    ],
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginTop: '1.5rem' }}>
        <FileTree root={treeStructure} />
      </div>
    </main>
  )
}

