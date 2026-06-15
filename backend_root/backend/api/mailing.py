from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import escape


def send_link_email(*, subject, recipient, intro, link_label, link_url):
    escaped_intro = escape(intro)
    escaped_label = escape(link_label)
    escaped_url = escape(link_url)

    text_body = (
        f"{intro}\n\n"
        f"{link_url}\n\n"
        "If the button does not work, copy and paste the full link into your browser."
    )
    html_body = (
        f"<p>{escaped_intro}</p>"
        f"<p><a href=\"{escaped_url}\">{escaped_label}</a></p>"
        "<p>If the button does not work, copy and paste this URL:</p>"
        f"<p><a href=\"{escaped_url}\">{escaped_url}</a></p>"
    )

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient],
    )
    message.attach_alternative(html_body, "text/html")
    message.send()
