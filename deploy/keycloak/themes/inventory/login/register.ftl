<#import "template.ftl" as layout>
<#import "user-profile-commons.ftl" as userProfileCommons>
<#import "register-commons.ftl" as registration>
<#import "password-fields.ftl" as passwordFields>
<@layout.registrationLayout displayRequiredFields=true; section>
  <#if section == "header"><#if messageHeader??>${kcSanitize(msg(messageHeader))?no_esc}<#else>${msg("registerTitle")}</#if>
  <#elseif section == "form">
    <#if !passwordRequired??><p class="help">${msg("inventoryRegistrationHelp")}</p></#if>
    <form id="kc-register-form" action="${url.registrationAction}" method="post">
      <@userProfileCommons.userProfileFormFields; callback, attribute>
        <#if callback == 'afterField' && passwordRequired?? && (attribute.name == 'email' && realm.registrationEmailAsUsername || attribute.name == 'username')>
          <@passwordFields.field id="password" label="password" />
          <@passwordFields.field id="password-confirm" label="passwordConfirm" />
        </#if>
      </@userProfileCommons.userProfileFormFields>
      <@registration.termsAcceptance/>
      <#if recaptchaRequired??><div class="g-recaptcha" data-sitekey="${recaptchaSiteKey}" data-action="${recaptchaAction}"></div></#if>
      <button class="button button-primary button-block" type="submit">${msg("doRegister")}</button>
      <p class="additional-info"><a href="${url.loginUrl}">${msg("backToLogin")}</a></p>
    </form>
  </#if>
</@layout.registrationLayout>
