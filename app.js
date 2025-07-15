document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const dropArea = document.getElementById('drop-area');
    const fileElem = document.getElementById('fileElem');
    const filePreview = document.getElementById('file-preview');
    const uploadBtn = document.getElementById('upload-btn');
    const loginBtn = document.getElementById('login-btn');
    const signupBtn = document.getElementById('signup-btn');
    const authModal = document.getElementById('auth-modal');
    const shareModal = document.getElementById('share-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const passwordProtect = document.getElementById('password-protect');
    const passwordInput = document.querySelector('.password-input');
    const expiryDate = document.getElementById('expiry-date');
    const dateInput = document.querySelector('.date-input');
    const copyLinkBtn = document.getElementById('copy-link');
    const shareLink = document.getElementById('share-link');
    
    // Global variables
    let selectedFiles = [];
    
    // Initialize the application
    function init() {
        setupEventListeners();
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            dropArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropArea.addEventListener(eventName, unhighlight, false);
        });
        
        dropArea.addEventListener('drop', handleDrop, false);
        
        // Button click events
        loginBtn.addEventListener('click', () => openModal(authModal, 'login'));
        signupBtn.addEventListener('click', () => openModal(authModal, 'signup'));
        uploadBtn.addEventListener('click', handleUpload);
        
        // Close modal events
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                authModal.style.display = 'none';
                shareModal.style.display = 'none';
            });
        });
        
        // Tab switching
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        
        // Share options
        passwordProtect.addEventListener('change', () => {
            passwordInput.classList.toggle('hidden', !passwordProtect.checked);
        });
        
        expiryDate.addEventListener('change', () => {
            dateInput.classList.toggle('hidden', !expiryDate.checked);
        });
        
        // Copy link button
        copyLinkBtn.addEventListener('click', copyShareLink);
        
        // Window click to close modal
        window.addEventListener('click', (e) => {
            if (e.target === authModal) authModal.style.display = 'none';
            if (e.target === shareModal) shareModal.style.display = 'none';
        });
    }
    
    // Prevent default drag and drop behavior
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area when dragging over
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    // Remove highlight when dragging leaves
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    // Handle dropped files
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    // Process selected files
    function handleFiles(files) {
        selectedFiles = [...files];
        updateFilePreview();
        uploadBtn.disabled = selectedFiles.length === 0;
    }
    
    // Update file preview area
    function updateFilePreview() {
        filePreview.innerHTML = '';
        
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // Determine file icon based on type
            let iconClass = 'fa-file';
            if (file.type.startsWith('image/')) iconClass = 'fa-file-image';
            else if (file.type.startsWith('video/')) iconClass = 'fa-file-video';
            else if (file.type.startsWith('audio/')) iconClass = 'fa-file-audio';
            else if (file.type.includes('pdf')) iconClass = 'fa-file-pdf';
            else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) iconClass = 'fa-file-word';
            else if (file.type.includes('excel') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) iconClass = 'fa-file-excel';
            else if (file.type.includes('zip') || file.name.endsWith('.zip') || file.name.endsWith('.rar')) iconClass = 'fa-file-archive';
            
            fileItem.innerHTML = `
                <i class="fas ${iconClass}"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">${formatFileSize(file.size)}</span>
                <button class="file-remove" data-index="${index}"><i class="fas fa-times"></i></button>
            `;
            
            filePreview.appendChild(fileItem);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.file-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                selectedFiles = selectedFiles.filter((_, i) => i !== index);
                updateFilePreview();
                uploadBtn.disabled = selectedFiles.length === 0;
            });
        });
    }
    
    // Format file size for display
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Handle file upload
    function handleUpload() {
        if (selectedFiles.length === 0) return;
        
        // Show loading state
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        // Simulate upload process
        setTimeout(() => {
            // In a real application, you would use FormData and fetch/axios to upload files
            // For this demo, we'll simulate a successful upload
            const shareUrl = `https://fileshare.example.com/s/${generateRandomString(10)}`;
            showShareModal(shareUrl);
            
            // Reset upload state
            selectedFiles = [];
            updateFilePreview();
            uploadBtn.innerHTML = 'Upload Files';
            uploadBtn.disabled = true;
        }, 2000);
    }
    
    // Generate a random string for share URLs
    function generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    // Show share modal with generated link
    function showShareModal(url) {
        shareLink.value = url;
        shareModal.style.display = 'block';
    }
    
    // Copy share link to clipboard
    function copyShareLink() {
        shareLink.select();
        document.execCommand('copy');
        
        // Show copied feedback
        const originalText = copyLinkBtn.innerHTML;
        copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyLinkBtn.innerHTML = originalText;
        }, 2000);
    }
    
    // Open modal and set active tab
    function openModal(modal, activeTab = null) {
        modal.style.display = 'block';
        
        if (activeTab) {
            switchTab(activeTab);
        }
    }
    
    // Switch between tabs
    function switchTab(tabId) {
        // Update tab buttons
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        // Update tab contents
        tabContents.forEach(content => {
            const isActive = content.id === `${tabId}-tab`;
            content.classList.toggle('active', isActive);
        });
    }
    
    // Initialize the app
    init();
});