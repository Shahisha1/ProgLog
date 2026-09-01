# Security Policy

## Supported Versions

The project currently supports the latest main branch and the most recent release build.

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

Instead, report them privately by emailing the maintainer or by contacting the project owner through the official repository security channel.

Please include:

- a description of the issue
- affected files or routes
- reproduction steps if available
- impact assessment
- any suggested remediation

## Response Expectations

We aim to:

- acknowledge valid reports within 5 business days
- assess and triage the issue promptly
- provide a remediation timeline when a fix is in progress
- communicate any temporary mitigation if needed

## Security Best Practices

This project uses:

- static HTML/CSS/JS hosting patterns
- optional Firebase persistence
- localStorage-based app state for offline behavior
- client-side validation for approved email domains

Because this is a front-end static application, users should also be aware that:

- client-side validation is not a substitute for server-side enforcement
- secrets and API keys must never be committed to the repository
- Firebase config and RAWG API keys should remain private

## Responsible Disclosure

We ask reporters to avoid exposing security issues publicly until a fix is available or a reasonable remediation window has passed.

Thank you for helping keep the project safe.
