(() => {
    const form = document.getElementById('reset-form');

    if (!(form instanceof HTMLFormElement)) {
        return;
    }

    const submitButton = document.getElementById('submit-button');
    const errorBox = document.getElementById('error-box');
    const successBox = document.getElementById('success-box');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (
        !(submitButton instanceof HTMLButtonElement) ||
        !(errorBox instanceof HTMLElement) ||
        !(successBox instanceof HTMLElement) ||
        !(passwordInput instanceof HTMLInputElement) ||
        !(confirmPasswordInput instanceof HTMLInputElement)
    ) {
        return;
    }

    const submitEndpoint = (form.dataset.submitEndpoint || '').trim();
    const tokenFromData = (form.dataset.token || '').trim();
    const tokenFromQuery = (new URLSearchParams(window.location.search).get('token') || '').trim();
    const token = tokenFromData || tokenFromQuery;

    const passwordRule = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,128}$/;
    const genericErrorMessage = 'Unable to update password. Please try again.';

    const setError = message => {
        errorBox.textContent = message;
        errorBox.style.display = 'block';
        successBox.style.display = 'none';
    };

    const setSuccess = message => {
        successBox.textContent = message;
        successBox.style.display = 'block';
        errorBox.style.display = 'none';
    };

    const clearMessages = () => {
        errorBox.style.display = 'none';
        successBox.style.display = 'none';
    };

    const setConfirmPasswordValidity = () => {
        const hasMismatch =
            confirmPasswordInput.value.length > 0 && passwordInput.value !== confirmPasswordInput.value;

        confirmPasswordInput.setCustomValidity(hasMismatch ? 'Confirm password must match password.' : '');
    };

    const validateForm = (password, confirmPassword) => {
        if (!password || !confirmPassword) {
            return 'Password and confirm password are required.';
        }

        if (!passwordRule.test(password)) {
            return 'Password must be 8-128 characters and include uppercase, lowercase, and number.';
        }

        if (password !== confirmPassword) {
            return 'Confirm password must match password.';
        }

        return null;
    };

    if (!submitEndpoint || !token) {
        submitButton.disabled = true;
        setError('Reset link is invalid. Please request a new password link and try again.');
        return;
    }

    passwordInput.addEventListener('input', () => {
        setConfirmPasswordValidity();
        clearMessages();
    });

    confirmPasswordInput.addEventListener('input', () => {
        setConfirmPasswordValidity();
        clearMessages();
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const validationError = validateForm(password, confirmPassword);

        if (validationError) {
            setError(validationError);
            return;
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        try {
            const response = await fetch(submitEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token, password, confirmPassword })
            });

            let body = null;
            try {
                body = await response.json();
            } catch {
                body = null;
            }

            if (!response.ok) {
                const message = body && typeof body === 'object' ? body.message : genericErrorMessage;
                setError(Array.isArray(message) ? message.join(', ') : String(message || genericErrorMessage));
                return;
            }

            setSuccess('Password updated successfully. You can now continue to the app.');
            form.reset();
            setConfirmPasswordValidity();
        } catch {
            setError(genericErrorMessage);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Password';
        }
    });
})();
