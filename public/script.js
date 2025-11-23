document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('acknowledgmentForm');
    const messageDiv = document.getElementById('message');
    const emailInput = document.getElementById('email');
    const numberOfGuestsInput = document.getElementById('numberOfGuests');
    const numberOfChildrenInput = document.getElementById('numberOfChildren');
    const relationshipGroup = document.getElementById('relationshipGroup');
    const relationshipTypeSelect = document.getElementById('relationshipType');

    // Function to update relationship and forms based on total people
    function updateRelationshipAndForms() {
        const numAdults = parseInt(numberOfGuestsInput.value) || 1;
        const numChildren = parseInt(numberOfChildrenInput.value) || 0;
        const totalPeople = numAdults + numChildren;

        // Show relationship dropdown if total people > 1
        if (totalPeople > 1) {
            relationshipGroup.style.display = 'block';
            relationshipTypeSelect.required = true;
        } else {
            relationshipGroup.style.display = 'none';
            relationshipTypeSelect.required = false;
            relationshipTypeSelect.value = '';
        }

        // Generate forms only for additional adults (not children)
        if (numAdults > 1) {
            generateAdditionalGuestForms(numAdults - 1);
        } else {
            clearAdditionalGuestForms();
        }
    }

    // Event listeners for both adult and children inputs
    numberOfGuestsInput.addEventListener('input', updateRelationshipAndForms);
    numberOfChildrenInput.addEventListener('input', updateRelationshipAndForms);

    function generateAdditionalGuestForms(numAdditionalGuests) {
        const container = document.getElementById('additionalGuestsContainer');
        container.innerHTML = '';

        for (let i = 0; i < numAdditionalGuests; i++) {
            const guestNumber = i + 2;
            const guestSection = document.createElement('div');
            guestSection.className = 'additional-guest-section';
            guestSection.innerHTML = `
                <h3>Adult Guest ${guestNumber} Details</h3>

                <div class="form-group">
                    <label for="guest${i}_name">Full Name *</label>
                    <input type="text" id="guest${i}_name" name="guest${i}_name" class="guest-input" data-guest-index="${i}" data-field="name" required>
                </div>

                <div class="form-group">
                    <label for="guest${i}_dob">Date of Birth *</label>
                    <input type="date" id="guest${i}_dob" name="guest${i}_dob" class="guest-input" data-guest-index="${i}" data-field="dob" required>
                </div>

                <div class="form-group">
                    <label for="guest${i}_govtIdType">Government ID Type *</label>
                    <select id="guest${i}_govtIdType" name="guest${i}_govtIdType" class="guest-input" data-guest-index="${i}" data-field="govtIdType" required>
                        <option value="">Select ID Type</option>
                        <option value="Aadhar">Aadhar Card</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Passport">Passport</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="guest${i}_govtIdNumber">Government ID Number *</label>
                    <input type="text" id="guest${i}_govtIdNumber" name="guest${i}_govtIdNumber" class="guest-input" data-guest-index="${i}" data-field="govtIdNumber" required>
                </div>
            `;
            container.appendChild(guestSection);

            // Set max date for DOB (must be at least 18 years old)
            const guestDobInput = document.getElementById(`guest${i}_dob`);
            const maxDate = new Date();
            maxDate.setFullYear(maxDate.getFullYear() - 18);
            guestDobInput.max = maxDate.toISOString().split('T')[0];
        }
    }

    function clearAdditionalGuestForms() {
        const container = document.getElementById('additionalGuestsContainer');
        container.innerHTML = '';
    }

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
        const numberOfChildren = parseInt(document.getElementById('numberOfChildren').value) || 0;
        const totalPeople = numberOfGuests + numberOfChildren;

        const formData = {
            name: document.getElementById('name').value.trim(),
            email: document.getElementById('email').value.trim(),
            dob: document.getElementById('dob').value,
            govtIdType: document.getElementById('govtIdType').value,
            govtIdNumber: document.getElementById('govtIdNumber').value.trim(),
            numberOfGuests: numberOfGuests,
            numberOfChildren: numberOfChildren,
            relationshipType: totalPeople > 1 ? document.getElementById('relationshipType').value : null,
            additionalGuests: []
        };

        // Collect additional adult guest data if there are multiple adults
        if (numberOfGuests > 1) {
            const guestInputs = document.querySelectorAll('.guest-input');
            const guestDataMap = {};

            guestInputs.forEach(input => {
                const guestIndex = input.dataset.guestIndex;
                const field = input.dataset.field;

                if (!guestDataMap[guestIndex]) {
                    guestDataMap[guestIndex] = {};
                }

                guestDataMap[guestIndex][field] = input.value.trim();
            });

            // Convert map to array
            formData.additionalGuests = Object.values(guestDataMap);
        }

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

        // Validate number of adults and children
        if (numberOfGuests < 1) {
            showMessage('Number of adults must be at least 1.', 'error');
            return;
        }

        if (numberOfChildren < 0) {
            showMessage('Number of children cannot be negative.', 'error');
            return;
        }

        // Validate relationship type for multiple people
        if (totalPeople > 1 && !formData.relationshipType) {
            showMessage('Please select the relationship type when there are multiple people.', 'error');
            return;
        }

        // Validate additional adult guests data
        if (numberOfGuests > 1) {
            if (formData.additionalGuests.length !== numberOfGuests - 1) {
                showMessage('Please fill in all additional adult guest details.', 'error');
                return;
            }

            for (let i = 0; i < formData.additionalGuests.length; i++) {
                const guest = formData.additionalGuests[i];
                const guestNum = i + 2;

                // Validate DOB
                if (!validateDOB(guest.dob)) {
                    showMessage(`Adult Guest ${guestNum}: Please enter a valid date of birth. Must be at least 18 years old.`, 'error');
                    return;
                }

                // Validate government ID
                if (!validateGovtId(guest.govtIdType, guest.govtIdNumber)) {
                    showMessage(`Adult Guest ${guestNum}: Please enter a valid government ID number.`, 'error');
                    return;
                }
            }
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

                // Clear additional guest forms
                clearAdditionalGuestForms();

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
