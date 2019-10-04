import path from 'path'

const createTagPages = (createPage, edges) => {
  const tagTemplate = path.resolve(`src/tag.tsx`)
  const tagsTemplate = path.resolve(`src/tags/tags.tsx`)
  const posts = {}

  edges.forEach(({ node }) => {
    if (node.frontmatter.tags) {
      node.frontmatter.tags.forEach(tag => {
        if (!posts[tag]) {
          posts[tag] = []
        }
        posts[tag].push(node)
      })
    }
  })

  createPage({
    path: '/tag',
    component: tagsTemplate,
    context: {
      posts
    }
  })

  Object.keys(posts).forEach(tagName => {
    const post = posts[tagName]
    createPage({
      path: `/tag/${tagName}`,
      component: tagTemplate,
      context: {
        posts,
        post,
        tag: tagName
      }
    })
  })
}

export const createPages = ({ actions, graphql }) => {
  const { createPage } = actions

  createPage({
    path: '/404',
    component: path.resolve('src/404/404.tsx')
  })

  const blogPostTemplate = path.resolve('src/post/post.tsx')
  return graphql(`
    {
      allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
        edges {
          node {
            excerpt(format: HTML)
            html
            id
            frontmatter {
              date
              path
              tags
              title
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors)
    }

    const posts = result.data.allMarkdownRemark.edges

    createTagPages(createPage, posts)
    createPage({
      path: '/archive',
      component: path.resolve('src/archive.tsx'),
      context: {
        post: posts.map(post => post.node)
      }
    })

    createPage({
      path: '/',
      component: path.resolve('src/index/index.tsx'),
      context: result.data
    })

    // Create pages for each markdown file.
    posts.forEach(({ node }, index) => {
      const prev = index === 0 ? null : posts[index - 1].node
      const next = index === posts.length - 1 ? null : posts[index + 1].node
      createPage({
        path: node.frontmatter.path,
        component: blogPostTemplate,
        context: {
          prev,
          next
        }
      })
    })

    return posts
  })
}
