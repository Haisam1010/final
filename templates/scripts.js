// JavaScript code to interact with the Flask API
const postForm = document.getElementById('postForm');
const contentInput = document.getElementById('content');
const errorContainer = document.getElementById('errorContainer');
const postList = document.getElementById('postList');
const viewAllPostsButton = document.getElementById('viewAllPosts');

// Function to display error messages
function showError(message) {
    if (errorContainer) {
        errorContainer.textContent = message;
        setTimeout(() => {
            errorContainer.textContent = ''; // Clear the error message after 5 seconds
        }, 5000); // 5000 milliseconds (5 seconds)
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Your existing code here...

    const logoutButton = document.getElementById('logoutButton');

    logoutButton.addEventListener('click', () => {
        // Clear the JWT token from local storage (or perform logout actions)
        localStorage.removeItem('token');
        alert('logging out');
        // Replace the current history entry with the login page
        window.history.replaceState(null, null, '/login.html');
        // Redirect or perform other actions after logout
        window.location.href = 'login.html'; // Redirect to the login page
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Send a POST request to your backend for authentication
        try {
            const response = await fetch('http://127.0.0.1:3000/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.token;
                // Store the JWT token in local storage or as needed
                localStorage.setItem('token', token);
                // Redirect to a secure area or perform other actions
                alert('Login Successful');
                window.location.href = '/index.html';
            } else {
                // Handle authentication error (e.g., show an error message)
                alert('Authentication failed\nEnter the correct user credentials');
            }
        } catch (error) {
            alert('Error:', error);
        }
    });
});

// Function to fetch and display posts
async function fetchPosts() {
    if (postList) {
        try {
            const response = await fetch('http://127.0.0.1:3000/get_posts');

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const posts = await response.json();

            if (!Array.isArray(posts)) {
                throw new Error('Invalid response format');
            }

            postList.innerHTML = '';

            posts.forEach(post => {
                const li = document.createElement('li');
                li.className = 'post-item';
                li.textContent = post.content;
                
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deletePost(post.id));

                const updateButton = document.createElement('button');
                updateButton.textContent = 'Update';
                updateButton.addEventListener('click', () => updatePost(post.id, post.content));

                li.appendChild(deleteButton);
                //li.appendChild(updateButton);
                postList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching posts:', error);
            showError('An error occurred while fetching posts.');
        }
    }
}

// Function to add a new post
async function addPost(content) {
    if (contentInput && errorContainer) {
        try {
            const response = await fetch('http://127.0.0.1:3000/add_post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                contentInput.value = '';
                errorContainer.textContent = '';
                fetchPosts();
            } else {
                // Check if the response contains JSON data
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    showError(errorData.error);
                } else {
                    // Handle the case where the response is not in JSON format
                    showError('An error occurred while adding the post.');
                }
            }
        } catch (error) {
            console.error('Error adding post:', error);
        }
    }
}

// Function to delete a post
async function deletePost(postId) {
    if (postList) {
        try {
            const response = await fetch(`http://127.0.0.1:3000/delete_post/${encodeURIComponent(postId)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchPosts();
            } else {
                const errorData = await response.json();
                showError(errorData.error);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
        }
    }
}

// Function to update a post
async function updatePost(postId, currentContent) {
    if (postList) {
        const updatedContent = prompt('Update the post:', currentContent);

        if (updatedContent !== null) {
            try {
                const response = await fetch(`http://127.0.0.1:3000/update_post/${encodeURIComponent(postId)}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ content: updatedContent })
                });

                if (response.ok) {
                    fetchPosts();
                } else {
                    const errorData = await response.json();
                    showError(errorData.error);
                }
            } catch (error) {
                console.error('Error updating post:', error);
            }
        }
    }
}

// Event listener for form submission
if (postForm) {
    postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = contentInput.value.trim();

        if (content !== '') {
            addPost(content);
        } else {
            showError('Content cannot be empty.');
        }
    });
}

// Event listener for viewing all posts
if (viewAllPostsButton) {
    viewAllPostsButton.addEventListener('click', () => {
        fetchPosts();
    });
}

// Initial fetch of posts
fetchPosts();

// Function to escape HTML content
function escapeHTML(unsafe) {
    return unsafe.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}