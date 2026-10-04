<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=true; section>
  <#if section == "header">${msg("emailForgotTitle")}
  <#elseif section == "form">
    <p class="help">${msg("inventoryResetHelp")}</p>
    <form id="kc-reset-password-form" action="${url.loginAction}" method="post">
      <div class="field"><label for="username">${msg("email")}</label><input id="username" name="username" type="email" autocomplete="username" value="${(auth.attemptedUsername)!''}" required autofocus></div>
      <button class="button button-primary button-block" type="submit">${msg("inventorySendReset")}</button>
    </form>
  <#elseif section == "info"><a href="${url.loginUrl}">${msg("backToLogin")}</a>
  </#if>
</@layout.registrationLayout>
