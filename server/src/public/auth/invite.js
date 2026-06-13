(() => {
    const form = document.getElementById('invite-form');
    const acceptButton = document.getElementById('accept-button');
    const declineButton = document.getElementById('decline-button');
    const errorBox = document.getElementById('error-box');
    const successBox = document.getElementById('success-box');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // If no form exists (expired/invalid state), nothing to wire up
    if (!(form instanceof HTMLFormElement)) {
        return;
    }

    if (
        !(
            acceptButton instanceof HTMLButtonElement &&
            declineButton instanceof HTMLButtonElement &&
            errorBox instanceof HTMLElement &&
            successBox instanceof HTMLElement
        )
    ) {
        return;
    }

    const acceptEndpoint = (form.dataset.acceptEndpoint || '').trim();
    const declineEndpoint = (form.dataset.declineEndpoint || '').trim();
    const token = (form.dataset.token || '').trim();
    const isNewUser = form.dataset.isNewUser === 'true';
    const genericErrorMessage = 'Something went wrong. Please try again.';

    // Password validation elements (only present for new users)
    const lengthRule = document.getElementById('rule-length');
    const uppercaseRule = document.getElementById('rule-uppercase');
    const lowercaseRule = document.getElementById('rule-lowercase');
    const numberRule = document.getElementById('rule-number');
    const matchRule = document.getElementById('rule-match');

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

    const setRuleState = (ruleElement, isComplete) => {
        if (!ruleElement) return;
        if (isComplete) {
            ruleElement.classList.add('completed');
        } else {
            ruleElement.classList.remove('completed');
        }
    };

    const updatePasswordValidation = () => {
        if (!isNewUser || !passwordInput || !confirmPasswordInput) return true;

        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        const hasLength = password.length >= 8;
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

        setRuleState(lengthRule, hasLength);
        setRuleState(uppercaseRule, hasUppercase);
        setRuleState(lowercaseRule, hasLowercase);
        setRuleState(numberRule, hasNumber);
        setRuleState(matchRule, hasMatch);

        return hasLength && hasUppercase && hasLowercase && hasNumber && hasMatch;
    };

    const updateAcceptButtonState = () => {
        if (isNewUser) {
            acceptButton.disabled = !updatePasswordValidation();
        } else {
            acceptButton.disabled = false;
        }
    };

    // Wire up password input events for new users
    if (isNewUser && passwordInput && confirmPasswordInput) {
        const handleInput = () => {
            clearMessages();
            updateAcceptButtonState();
        };

        passwordInput.addEventListener('input', handleInput);
        confirmPasswordInput.addEventListener('input', handleInput);
    }

    // Handle Accept
    acceptButton.addEventListener('click', async event => {
        event.preventDefault();
        clearMessages();

        const body = { token };

        if (isNewUser && passwordInput && confirmPasswordInput) {
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            if (!password || !confirmPassword) {
                setError('Password and confirm password are required.');
                return;
            }

            if (password !== confirmPassword) {
                setError('Passwords do not match.');
                return;
            }

            body.password = password;
            body.confirmPassword = confirmPassword;
        }

        acceptButton.disabled = true;
        declineButton.disabled = true;
        acceptButton.textContent = 'Accepting...';

        try {
            const response = await fetch(acceptEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            let responseBody = null;
            try {
                responseBody = await response.json();
            } catch {
                responseBody = null;
            }

            if (!response.ok) {
                const message =
                    responseBody && typeof responseBody === 'object'
                        ? responseBody.message
                        : genericErrorMessage;
                setError(Array.isArray(message) ? message.join(', ') : String(message || genericErrorMessage));
                return;
            }

            const redirectUrl =
                responseBody && typeof responseBody === 'object' && typeof responseBody.redirectUrl === 'string'
                    ? responseBody.redirectUrl.trim()
                    : '/';

            setSuccess('Invitation accepted! Redirecting...');

            window.setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1200);
        } catch {
            setError(genericErrorMessage);
        } finally {
            acceptButton.textContent = 'Accept';
            updateAcceptButtonState();
            declineButton.disabled = false;
        }
    });

    // Handle Decline
    declineButton.addEventListener('click', async event => {
        event.preventDefault();
        clearMessages();

        const confirmed = window.confirm('Are you sure you want to decline this invitation?');
        if (!confirmed) return;

        acceptButton.disabled = true;
        declineButton.disabled = true;
        declineButton.textContent = 'Declining...';

        try {
            const response = await fetch(declineEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token })
            });

            let responseBody = null;
            try {
                responseBody = await response.json();
            } catch {
                responseBody = null;
            }

            if (!response.ok) {
                const message =
                    responseBody && typeof responseBody === 'object'
                        ? responseBody.message
                        : genericErrorMessage;
                setError(Array.isArray(message) ? message.join(', ') : String(message || genericErrorMessage));
                return;
            }

            setSuccess('Invitation declined.');

            // Hide buttons after decline
            acceptButton.style.display = 'none';
            declineButton.style.display = 'none';
        } catch {
            setError(genericErrorMessage);
        } finally {
            declineButton.textContent = 'Decline';
            declineButton.disabled = false;
            updateAcceptButtonState();
        }
    });

    // Initial state
    updateAcceptButtonState();
})();
