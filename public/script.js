document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('acknowledgmentForm');
    const messageDiv = document.getElementById('message');
    const emailInput = document.getElementById('email');
    const numberOfGuestsInput = document.getElementById('numberOfGuests');
    const relationshipGroup = document.getElementById('relationshipGroup');
    const relationshipTypeSelect = document.getElementById('relationshipType');

    // Show/hide relationship field based on number of guests
    numberOfGuestsInput.addEventListener('input', function() {
        const numGuests = parseInt(this.value);
        if (numGuests > 1) {
            relationshipGroup.style.display = 'block';
            relationshipTypeSelect.required = true;
        } else {
            relationshipGroup.style.display = 'none';
            relationshipTypeSelect.required = false;
            relationshipTypeSelect.value = '';
        }
    });

    // Check if email already acknowledged on blur
    emailInput.addEventListener('blur', async function() {
        const email = this.value.trim();
        if (email && validateEmail(email)) {
            try {
                const response = await fetch(`/api/check-email/${encodeURIComponent(email)}`);
                const data = await response.json();

                if (data.exists) {
                    showMessage('This email has already acknowledged the house rules.', 'info');
                }
            } catch (error) {
                console.error('Error checking email:', error);
            }
        }
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Clear previous messages
        hideMessage();

        // Get form data
        const numberOfGuests = parseInt(document.getElementById('numberOfGuests').value);
        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            dob: document.getElementById('dob').value,
            govtIdType: document.getElementById('govtIdType').value,
            govtIdNumber: document.getElementById('govtIdNumber').value.trim(),
            numberOfGuests: numberOfGuests,
            relationshipType: numberOfGuests > 1 ? document.getElementById('relationshipType').value : null
        };

        // Validate checkboxes
        const confirmRead = document.getElementById('confirmRead').checked;
        const confirmAgree = document.getElementById('confirmAgree').checked;

        if (!confirmRead || !confirmAgree) {
            showMessage('Please confirm that you have read and agree to the house rules.', 'error');
            return;
        }

        // Validate email
        if (!validateEmail(formData.email)) {
            showMessage('Please enter a valid email address.', 'error');
            return;
        }

        // Validate date of birth
        if (!validateDOB(formData.dob)) {
            showMessage('Please enter a valid date of birth. You must be at least 18 years old.', 'error');
            return;
        }

        // Validate government ID
        if (!validateGovtId(formData.govtIdType, formData.govtIdNumber)) {
            showMessage('Please enter a valid government ID number.', 'error');
            return;
        }

        // Validate number of guests and relationship
        if (numberOfGuests < 1) {
            showMessage('Number of guests must be at least 1.', 'error');
            return;
        }

        if (numberOfGuests > 1 && !formData.relationshipType) {
            showMessage('Please select the relationship with additional guest(s).', 'error');
            return;
        }

        // Disable submit button
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const response = await fetch('/api/acknowledge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('Thank you! Your acknowledgment has been recorded successfully.', 'success');
                form.reset();

                // Reset relationship group visibility
                relationshipGroup.style.display = 'none';
                relationshipTypeSelect.required = false;

                // Scroll to message
                messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                showMessage(result.error || 'An error occurred. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('Network error. Please check your connection and try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Acknowledgment';
        }
    });

    function showMessage(text, type) {
        messageDiv.textContent = text;
        messageDiv.className = `message ${type} show`;
    }

    function hideMessage() {
        messageDiv.className = 'message';
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validateDOB(dob) {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age >= 18 && birthDate < today;
    }

    function validateGovtId(type, number) {
        number = number.replace(/\s/g, '');

        switch(type) {
            case 'Aadhar':
                // Aadhar: 12 digits
                return /^\d{12}$/.test(number);

            case 'Driving License':
                // Driving License: Various formats, typically alphanumeric
                return /^[A-Z0-9]{8,20}$/.test(number.toUpperCase());

            case 'Passport':
                // Passport: Typically 8 characters, alphanumeric
                return /^[A-Z0-9]{6,10}$/.test(number.toUpperCase());

            default:
                return false;
        }
    }

    // Set max date for DOB (must be at least 18 years old)
    const dobInput = document.getElementById('dob');
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 18);
    dobInput.max = maxDate.toISOString().split('T')[0];
});
