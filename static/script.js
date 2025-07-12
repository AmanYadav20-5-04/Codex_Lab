// ===================================================================================
// SCRIPT.JS - Skill Swap Platform Logic
// ===================================================================================

document.addEventListener('DOMContentLoaded', () => {

    // ===============================================================================
    // API CONFIGURATION
    // ===============================================================================
    const API_BASE_URL = 'http://127.0.0.1:5000/api';

    // ===============================================================================
    // Application State
    // ===============================================================================
    let state = {
        currentUser: null,
        users: [],
        skills: [],
        swaps: []
    };

    // ===============================================================================
    // INITIALIZATION
    // ===============================================================================

    async function init() {
        const loggedInUser = JSON.parse(sessionStorage.getItem('currentUser'));
        if (loggedInUser) {
            state.currentUser = loggedInUser;
            await fetchData();
            navigateTo('browse-page');
        } else {
            navigateTo('login-page');
        }

        // Attach event listeners
        document.getElementById('login-form').addEventListener('submit', handleLogin);
        document.getElementById('signup-form').addEventListener('submit', handleSignup);
        document.getElementById('search-bar').addEventListener('input', renderUserList);
        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('profile-edit-form').addEventListener('submit', handleProfileUpdate);
        document.getElementById('swap-proposal-form').addEventListener('submit', handleSwapProposal);
    }

    // ===============================================================================
    // DATA FETCHING
    // ===============================================================================
    async function fetchData() {
        try {
            const [usersResponse, skillsResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/users`),
                fetch(`${API_BASE_URL}/skills`)
            ]);
            if (!usersResponse.ok || !skillsResponse.ok) throw new Error('Failed to fetch users or skills');
            state.users = await usersResponse.json();
            state.skills = await skillsResponse.json();

            if (state.currentUser) {
                const swapsResponse = await fetch(`${API_BASE_URL}/users/${state.currentUser.id}/swaps`);
                if (!swapsResponse.ok) throw new Error('Failed to fetch swaps');
                state.swaps = await swapsResponse.json();
                // Refresh currentUser data from the full user list
                state.currentUser = state.users.find(u => u.id === state.currentUser.id) || state.currentUser;
                sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
            }
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            showModal("Error", "Could not connect to the server. Please ensure the backend is running.");
        }
    }

    // ===============================================================================
    // ROUTING / PAGE NAVIGATION
    // ===============================================================================
    window.navigateTo = (pageId, param = null) => {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        
        const header = document.getElementById('main-header');
        header.classList.toggle('hidden', !state.currentUser);

        switch (pageId) {
            case 'browse-page': renderUserList(); break;
            case 'my-profile-page': renderMyProfile(); break;
            case 'user-profile-page': renderUserProfile(param); break;
            case 'my-swaps-page': renderMySwaps(); break;
        }
    };

    // ===============================================================================
    // AUTHENTICATION
    // ===============================================================================
    async function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        // In a real app, send email and password to a dedicated /login endpoint
        try {
            const users = await (await fetch(`${API_BASE_URL}/users`)).json();
            const user = users.find(u => u.email === email);
            if (user) {
                state.currentUser = user;
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                await fetchData();
                navigateTo('browse-page');
            } else {
                showModal("Login Failed", "Invalid email or password.");
            }
        } catch (error) {
            showModal("Login Error", "Could not verify credentials.");
        }
    }
    
    async function handleSignup(e) {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        try {
            const response = await fetch(`${API_BASE_URL}/users/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const newUser = await response.json();
            if (response.ok) {
                state.currentUser = newUser;
                sessionStorage.setItem('currentUser', JSON.stringify(newUser));
                await fetchData();
                navigateTo('browse-page');
            } else {
                showModal("Signup Failed", newUser.error || "Could not create account.");
            }
        } catch (error) {
            showModal("Signup Error", "Could not connect to the server.");
        }
    }

    window.logout = () => {
        state.currentUser = null;
        sessionStorage.removeItem('currentUser');
        navigateTo('login-page');
    };

    // ===============================================================================
    // PAGE RENDERING FUNCTIONS
    // ===============================================================================
    function renderUserList() {
        const container = document.getElementById('user-list');
        const searchTerm = document.getElementById('search-bar').value.toLowerCase();
        
        const filteredUsers = state.users.filter(user => 
            user.id !== state.currentUser.id &&
            (searchTerm === '' || user.skills_offered.some(skill => skill.name.toLowerCase().includes(searchTerm)))
        );
        container.innerHTML = filteredUsers.length === 0 ? `<p class="text-gray-500 col-span-full text-center">No users found.</p>` : filteredUsers.map(user => `
            <div class="glass p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
                <div class="flex items-center mb-4">
                    <img src="https://placehold.co/100x100/E2E8F0/4A5568?text=${user.username.charAt(0)}" alt="${user.username}" class="w-16 h-16 rounded-full mr-4">
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">${user.username}</h3>
                        <p class="text-gray-500">${user.location || 'Location not set'}</p>
                    </div>
                </div>
                <div>
                    <h4 class="font-semibold text-gray-600 mb-2">Offers:</h4>
                    <div class="flex flex-wrap gap-2">${user.skills_offered.map(skill => `<span class="tag">${skill.name}</span>`).join('') || 'No skills offered.'}</div>
                </div>
                <button onclick="navigateTo('user-profile-page', ${user.id})" class="mt-4 w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition">View Profile</button>
            </div>`).join('');
    }

    function renderMyProfile() {
        const viewContainer = document.getElementById('profile-view');
        const user = state.currentUser;
        viewContainer.innerHTML = `
            <div class="flex justify-between items-start">
                <h2 class="text-3xl font-bold text-gray-800 mb-6">My Profile</h2>
                <button onclick="toggleProfileEdit(true)" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">Edit Profile</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-1 flex flex-col items-center">
                    <img src="https://placehold.co/100x100/E2E8F0/4A5568?text=${user.username.charAt(0)}" alt="${user.username}" class="w-32 h-32 rounded-full mb-4 shadow-lg">
                    <h3 class="text-2xl font-bold">${user.username}</h3><p class="text-gray-500">${user.location || 'No location'}</p>
                </div>
                <div class="md:col-span-2">
                    <div class="mb-6"><h4 class="font-semibold text-lg text-gray-700 mb-2">Bio</h4><p class="text-gray-600">${user.bio || 'No bio yet.'}</p></div>
                    <div class="mb-6"><h4 class="font-semibold text-lg text-gray-700 mb-2">Skills I Offer</h4><div class="flex flex-wrap gap-2">${user.skills_offered.map(s => `<span class="tag">${s.name}</span>`).join('') || '<p class="text-gray-500">No skills listed.</p>'}</div></div>
                    <div><h4 class="font-semibold text-lg text-gray-700 mb-2">Skills I Want</h4><div class="flex flex-wrap gap-2">${user.skills_seeking.map(s => `<span class="tag">${s.name}</span>`).join('') || '<p class="text-gray-500">No skills listed.</p>'}</div></div>
                </div>
            </div>`;
        toggleProfileEdit(false);
    }

    function renderUserProfile(userId) {
        const container = document.getElementById('user-profile-content');
        const user = state.users.find(u => u.id === userId);
        if (!user) { container.innerHTML = `<p>User not found.</p>`; return; }
        const existingRequest = state.swaps.find(s =>(s.proposer.id === state.currentUser.id && s.receiver.id === user.id) || (s.proposer.id === user.id && s.receiver.id === state.currentUser.id));
        const requestButtonHtml = existingRequest ? `<button class="w-full bg-gray-400 text-white py-3 rounded-lg cursor-not-allowed" disabled>Swap Request ${existingRequest.status}</button>` : `<button onclick="openSwapModal(${user.id})" class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition">Request Swap</button>`;
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-1 flex flex-col items-center text-center">
                    <img src="https://placehold.co/100x100/E2E8F0/4A5568?text=${user.username.charAt(0)}" alt="${user.username}" class="w-32 h-32 rounded-full mb-4 shadow-lg">
                    <h3 class="text-2xl font-bold">${user.username}</h3><p class="text-gray-500">${user.location || 'No location'}</p>
                    <div class="mt-6 w-full">${requestButtonHtml}</div>
                </div>
                <div class="md:col-span-2">
                    <h2 class="text-3xl font-bold text-gray-800 mb-6">User Profile</h2>
                    <div class="mb-6"><h4 class="font-semibold text-lg text-gray-700 mb-2">Skills Offered</h4><div class="flex flex-wrap gap-2">${user.skills_offered.map(s => `<span class="tag">${s.name}</span>`).join('')}</div></div>
                    <div><h4 class="font-semibold text-lg text-gray-700 mb-2">Skills Wanted</h4><div class="flex flex-wrap gap-2">${user.skills_seeking.map(s => `<span class="tag">${s.name}</span>`).join('')}</div></div>
                </div>
            </div>`;
    }

    async function renderMySwaps() {
        await fetchData();
        const incomingContainer = document.getElementById('incoming-requests');
        const outgoingContainer = document.getElementById('outgoing-requests');
        const incomingSwaps = state.swaps.filter(s => s.receiver.id === state.currentUser.id);
        const outgoingSwaps = state.swaps.filter(s => s.proposer.id === state.currentUser.id);

        incomingContainer.innerHTML = incomingSwaps.length === 0 ? `<p class="text-gray-500">No incoming requests.</p>` : incomingSwaps.map(swap => `
            <div class="glass p-4 rounded-lg shadow-sm border">
                <p class="text-gray-800">Request from <strong class="font-semibold">${swap.proposer.username}</strong> to swap <em>${swap.offered_skill.name}</em> for your <em>${swap.requested_skill.name}</em></p>
                <p class="text-sm text-gray-500">Status: <span class="font-medium capitalize text-indigo-600">${swap.status}</span></p>
                ${swap.status === 'pending' ? `<div class="mt-3 flex gap-2">
                    <button onclick="handleSwapAction(${swap.id}, 'accepted')" class="bg-green-500 text-white px-3 py-1 text-sm rounded-md hover:bg-green-600">Accept</button>
                    <button onclick="handleSwapAction(${swap.id}, 'rejected')" class="bg-red-500 text-white px-3 py-1 text-sm rounded-md hover:bg-red-600">Reject</button>
                </div>` : ''}
            </div>`).join('');

        outgoingContainer.innerHTML = outgoingSwaps.length === 0 ? `<p class="text-gray-500">No outgoing requests.</p>` : outgoingSwaps.map(swap => `
            <div class="glass p-4 rounded-lg shadow-sm border">
                <p class="text-gray-800">Request to <strong class="font-semibold">${swap.receiver.username}</strong> to swap <em>${swap.offered_skill.name}</em> for their <em>${swap.requested_skill.name}</em></p>
                <p class="text-sm text-gray-500">Status: <span class="font-medium capitalize text-indigo-600">${swap.status}</span></p>
            </div>`).join('');
    }

    // ===============================================================================
    // ACTIONS & EVENT HANDLERS
    // ===============================================================================
    window.toggleProfileEdit = (isEditing) => {
        if (isEditing) {
            const user = state.currentUser;
            document.getElementById('edit-username').value = user.username;
            document.getElementById('edit-location').value = user.location || '';
            document.getElementById('edit-bio').value = user.bio || '';
            document.getElementById('edit-skills-offered').value = user.skills_offered.map(s => s.name).join(', ');
            document.getElementById('edit-skills-seeking').value = user.skills_seeking.map(s => s.name).join(', ');
        }
        document.getElementById('profile-view').classList.toggle('hidden', isEditing);
        document.getElementById('profile-edit').classList.toggle('hidden', !isEditing);
    };

    async function handleProfileUpdate(e) {
        e.preventDefault();
        const payload = {
            username: document.getElementById('edit-username').value,
            location: document.getElementById('edit-location').value,
            bio: document.getElementById('edit-bio').value,
            skills_offered: document.getElementById('edit-skills-offered').value.split(',').map(s => s.trim()),
            skills_seeking: document.getElementById('edit-skills-seeking').value.split(',').map(s => s.trim()),
        };
        try {
            const response = await fetch(`${API_BASE_URL}/users/${state.currentUser.id}/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                state.currentUser = await response.json();
                sessionStorage.setItem('currentUser', JSON.stringify(state.currentUser));
                showModal("Success", "Your profile has been updated.");
                renderMyProfile();
            } else {
                showModal("Error", "Failed to update profile.");
            }
        } catch (error) {
            showModal("Error", "Could not connect to server.");
        }
    }
    
    window.openSwapModal = (receiverId) => {
        const receiver = state.users.find(u => u.id === receiverId);
        if (!receiver || state.currentUser.skills_offered.length === 0 || receiver.skills_offered.length === 0) {
            showModal("Cannot Swap", "Either you or the other user must have at least one skill to offer.");
            return;
        }
        document.getElementById('swap-receiver-id').value = receiverId;
        const offerSelect = document.getElementById('swap-offer-skill');
        const requestSelect = document.getElementById('swap-request-skill');
        offerSelect.innerHTML = state.currentUser.skills_offered.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        requestSelect.innerHTML = receiver.skills_offered.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        document.getElementById('swap-modal').classList.remove('hidden');
    };

    window.closeSwapModal = () => document.getElementById('swap-modal').classList.add('hidden');

    async function handleSwapProposal(e) {
        e.preventDefault();
        const payload = {
            proposer_id: state.currentUser.id,
            receiver_id: parseInt(document.getElementById('swap-receiver-id').value),
            offered_skill_id: parseInt(document.getElementById('swap-offer-skill').value),
            requested_skill_id: parseInt(document.getElementById('swap-request-skill').value),
            message: document.getElementById('swap-message').value
        };
        try {
            const response = await fetch(`${API_BASE_URL}/swaps/propose`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                await fetchData();
                closeSwapModal();
                showModal("Request Sent!", "Your swap request has been sent.");
                navigateTo('user-profile-page', payload.receiver_id);
            } else {
                showModal("Error", "Could not send swap request.");
            }
        } catch (error) {
            showModal("Error", "Could not connect to server.");
        }
    }

    window.handleSwapAction = async (swapId, action) => {
        try {
            const response = await fetch(`${API_BASE_URL}/swaps/${swapId}/respond`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action })
            });
            if (response.ok) {
                showModal("Status Updated", `The swap request has been ${action}.`);
                await renderMySwaps();
            } else {
                showModal("Error", "Could not update swap status.");
            }
        } catch (error) {
            showModal("Error", "Could not connect to server.");
        }
    };

    // ===============================================================================
    // MODAL UTILITY
    // ===============================================================================
    function showModal(title, message) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-message').innerText = message;
        document.getElementById('modal').classList.remove('hidden');
    }

    function closeModal() {
        document.getElementById('modal').classList.add('hidden');
    }

    // ===============================================================================
    // START THE APP
    // ===============================================================================
    init();
});
