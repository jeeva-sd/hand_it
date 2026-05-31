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
    const lengthRule = document.getElementById('rule-length');
    const uppercaseRule = document.getElementById('rule-uppercase');
    const lowercaseRule = document.getElementById('rule-lowercase');
    const numberRule = document.getElementById('rule-number');
    const matchRule = document.getElementById('rule-match');

    if (
        !(
            submitButton instanceof HTMLButtonElement &&
            errorBox instanceof HTMLElement &&
            successBox instanceof HTMLElement &&
            passwordInput instanceof HTMLInputElement &&
            confirmPasswordInput instanceof HTMLInputElement &&
            lengthRule instanceof HTMLElement &&
            uppercaseRule instanceof HTMLElement &&
            lowercaseRule instanceof HTMLElement &&
            numberRule instanceof HTMLElement &&
            matchRule instanceof HTMLElement
        )
    ) {
        return;
    }

    const submitEndpoint = (form.dataset.submitEndpoint || '').trim();
    const tokenFromData = (form.dataset.token || '').trim();
    const tokenFromQuery = (new URLSearchParams(window.location.search).get('token') || '').trim();
    const successRedirectUrl = (form.dataset.successRedirectUrl || '').trim();
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

    const setRuleState = (ruleElement, isComplete) => {
        if (isComplete) {
            ruleElement.classList.add('completed');
            return;
        }

        ruleElement.classList.remove('completed');
    };

    const updateValidationUi = () => {
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

    const updateSubmitState = () => {
        const hasValidRequestData = Boolean(submitEndpoint && token);
        const allRulesMet = updateValidationUi();
        submitButton.disabled = !(hasValidRequestData && allRulesMet);
        return allRulesMet;
    };

    const setConfirmPasswordValidity = () => {
        const hasMismatch = confirmPasswordInput.value.length > 0 && passwordInput.value !== confirmPasswordInput.value;

        confirmPasswordInput.setCustomValidity(hasMismatch ? 'Confirm password must match password.' : '');
    };

    const validateForm = (password, confirmPassword) => {
        if (!(password && confirmPassword)) {
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

    if (!(submitEndpoint && token)) {
        submitButton.disabled = true;
        setError('Reset link is invalid. Please request a new password link and try again.');
        return;
    }

    const handleInput = () => {
        setConfirmPasswordValidity();
        clearMessages();
        updateSubmitState();
    };

    passwordInput.addEventListener('input', handleInput);
    confirmPasswordInput.addEventListener('input', handleInput);

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

            const redirectUrlFromResponse =
                body && typeof body === 'object' && typeof body.redirectUrl === 'string' && body.redirectUrl.trim()
                    ? body.redirectUrl.trim()
                    : '';
            const redirectUrl = redirectUrlFromResponse || successRedirectUrl || '/';

            setSuccess('Password updated successfully. You can now continue to the app.');
            form.reset();
            setConfirmPasswordValidity();
            updateSubmitState();

            window.setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1200);
        } catch {
            setError(genericErrorMessage);
        } finally {
            updateSubmitState();
            submitButton.textContent = 'Save Password';
        }
    });

    setConfirmPasswordValidity();
    updateSubmitState();
})();
