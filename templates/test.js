
  const { TextEncoder,TextDecoder } = require('util');
  import { fetch } from 'jest-fetch-mock';

  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;

  global.testEnviroment = 'node';

  import { addPost, fetchPosts, deletePost, updatePost, login, logout} from './scripts.js';

  const mockFetch = jest.fn();
  global.fetch = mockFetch;

    describe('addPost()', function() {
      it('should add a new post', async function() {
          const content = 'Test Post';
          const mockResponse = { ok: true };
          global.fetch.mockResolvedValueOnce(mockResponse);

          await addPost(content);

          fetch('http://localhost:5000/add_post', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content })
        });
    });

    it('should show an error when adding a post fails', async function() {
        const fetch = jest.fn(() => Promise.resolve({ ok: false }));
        global.fetch = fetch;

        const content = 'Test Post';

        await addPost(content);

        fetch('http://localhost:5000/add_post', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
        });
    });
  });


  describe('fetchPosts()', function() {
    it('should fetch posts', async function() {
      const mockResponse = {
        ok: true,
        json: async () => [{ id: 1, content: 'Test Post 1' }],
    };
      global.fetch.mockResolvedValueOnce(mockResponse);

      const postList = document.createElement('ul');
      document.getElementById = jest.fn(() => postList);

      await fetchPosts();

      fetch('http://localhost:5000/get_posts');
    });

    it('should show an error when fetching posts fails', async function() {
      const fetch = jest.fn(() => Promise.resolve({ ok: false }));
      global.fetch = fetch;

      const postList = document.createElement('ul');

      await fetchPosts(postList);

      fetch('http://localhost:5000/get_posts');
    });
});


  describe('deletePost()', function() {
    it('should delete a post', async function() {
      const fetch = jest.fn(() => Promise.resolve({ ok: true }));
      global.fetch = fetch;

      const postId = 1;

      await deletePost(postId);

      fetch(`http://localhost:5000/delete_post/${encodeURIComponent(postId)}`, {
        method: 'DELETE'
      });
    });

    it('should show an error when deleting a post fails', async function() {
      const fetch = jest.fn(() => Promise.resolve({ ok: false }));
      global.fetch = fetch;

      const postId = 1;

      await deletePost(postId);

      fetch(`http://localhost:5000/delete_post/${encodeURIComponent(postId)}`, {
        method: 'DELETE'
      });
    });
});


    describe('updatePost()', function() {
      it('should update a post', async function() {
          const fetch = jest.fn(() => Promise.resolve({ ok: true }));
          global.fetch = fetch;

          const postId = 1;
          const updatedContent = 'Test Post 1 (Updated)';

          await updatePost(postId, updatedContent);

          fetch(`http://localhost:5000/update_post/${encodeURIComponent(postId)}`, {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ content: updatedContent })
        });
    });

    it('should show an error when updating a post fails', async function() {
        const fetch = jest.fn(() => Promise.resolve({ ok: false }));
        global.fetch = fetch;

        const postId = 1;
        const updatedContent = 'Test Post 1 (Updated)';

        await updatePost(postId, updatedContent);

        fetch(`http://localhost:5000/update_post/${encodeURIComponent(postId)}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: updatedContent })
        });
    });
  });

