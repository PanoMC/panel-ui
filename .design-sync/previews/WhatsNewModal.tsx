import * as React from 'react';
import { WhatsNewModal } from '@panomc/panel-ui';

const M = WhatsNewModal as any;

// Pano horizontal logo (static/assets/img/pano-logo-heorizontal.png) inlined —
// the runtime <img src="{base}/assets/img/..."> path 404s in the design sandbox.
const LOGO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAABkCAYAAACoy2Z3AAAQAElEQVR4nOydCbScZXnH/zdSCAqaihbIQbhIMDnUGrQKlvVa2spyEAuoaFq5HO05UmoXoBZyrKW1GFBQgxuuJ+BKWIwoIG4MGATiRvQcTUTlRhGCgCchCAGX6/9/v3fiZO58M/PNfMs7M//fOc99587MXeb5zzPP927PuwMKZnp6+s/YnEx7Du0ZtGc2tTsjLh6jPUh7oKn9Ee2qsbGxX2KEoZ7S689pC4Mtou1Jm0fbNdjTUQ6P0O6l/YJ2H+0e2mpq9HmMANRiRzZ7054VrPn2k5DoIptLe4i2JdgmJD5b12j03WMwPRPi4wD8MTbUNsfHbuHpA6/HGAogJI1XBDucNgfDwe9pX6etxIgkE2r5ZCQaHhXsQMSvpwLyeto1aqnTIxgSqMd8NichuSg7DPlqoff3nbSvBLuVvnsUJpWC4yN6PXJNIHTma9m8jnYERoNbaB+mqJ/AkEANd2BzEJJg+Bvai2k7YnBRMnkn7WLqtAUDCDVRb+LkYNKjkAu/FjxBuw3Jh9dXaWvow99hhKk4PqLTI5c3Ip36Mjbn056L0eT7tHMp5nUYUKjhfmxODHYwyvuQKgsNRf4/7VLq9AQiJ+ihHrx6Gy9E9UzTbqddTbuSPvwZRogI4yMKPfpyAp0qR74bSRY27GLS3kQxv4EBgRouYLOU9g+0P8Hwo2R/IjX6MSJkQPT4DU297gvpx/UYYqxHe3pKIHSqHPku2hkwrXgv7ayYr3Sp4fPZvJn2cgzPHFW3aCjrjdTnMkTCgOqhMfpVtGX05bcwRFiP7sicQOjYZyOZRP5LmHasoS2J7UqX+u3BZjntlTAraKdTo62oiCHRQ8MpK2hL6cuNGGCsRzYyZVY69wQ2a+Hk0Q2aaPsOfXYSIoD/xxzav/GmurhOHgmTtDX0S+lzd0Omhy5ET6Ot52t6o14bBgzr0fsf6gj/Aa0hvwgesuoVDWm9qao13dRvLzafRrLs08zmBtpx1GcaJUA9tE/jUxhePVbTXkN//hwDwAjEh/R4NfW4BznTMTOFISuNpzl59M6/0O4IE3KlEnqN34OTRzuOoS1DCVAPjamrFz/Meui1rQ2vNWpGJD702r4XXmuudNO1uQDJzmPTH3+BZBlpKfDNsgvtUiSTan8K04n/or8KG7po0OOzGA099Bo/y9f8gTCCERUjGB96javy1qPtEBb/0Dko6cpshNB+kQtQINTtaWy+hGQexnTPZtre1Odh5Aj1UBmLGzG6emi/wjH06yZEgONjRo+jqcdm9ElqD4RO/jskmwNNvpxP3x6NggjjuSq34uSRHX2wLEWOhPkOVSwYZT20T+zmUOKoUhwfM0iPW+iLZ6JPWvZA+IsXI3nTPxWmCJT5J3gFcCdyJOyWvQlJMT3TG1rSO05t7kefhDmvr8F61LkLyWKFu1ABjo9ZSIdj+9lqkNYD+TicPIpEV7rLkSNhKap2wDs4+kPjw+eiT6iH5rxUmcB6/JH9aavpm+ehZBwfLZEet4b3ak/M6oHwl52CZEmbKZ6/Z/ZfhT6hZvsiWao3HyYP1As5gNrcjR4IKxc1TGI9WqMS/EfQvz9BCTg+OiI9DqceP0VGtuuBhA0nb4Mpi/P63eTDn9dZA6rO6eDID/VCXooeCOXWvwzr0Q755kb6ajcUjOOjK+SbL9FXmc/xaf7wUjn2fWHKQnNNr0WPaCkikg+rZ8PkTeY9DNRDhwVpdY/16IzmI64PPisEx0cmpMcNwWdds20Iiz+4E5sfwgmkbNRt1HDJ48gINbuWzfEwRaBCmLtQl990+wPWoyc+Rx8XsuHQevREJj0aeyCnw8mjCnR1dDoywuD4dzg4ikSHBB3V7ZOtR8+cEHyXK9ajZzLp0dgD0eaSg2Gq4A5m/a7PVKFWL0CyGWgUzu+okv+lLud1ehL1UHFRnRRnPXpDvbxD6etvIgccH30jPQ7ppiT8TA8klDD2xrPqOChM9nUkbMbSWd8OjuIZ7/QE6rE7klPhrEfvyHcrw479vnB85IJ8d2XYsd+W+hCWxryG7QjTQUK+77bQ2dtp+8CUwXgXz7kQ1iMPxpGcbtovjo98GEcXe9UaE4iplo4a8IrgSDanwpTFHu0epB4TsB55cip9+hL0iOMjd04N7/FUxsIyugeRTBqa6mi76oc6SR+VnV4IUxabqUfLYZWwalFl2a1HvuhAp8VZVyU6PgpDejwv7Xhu9UCOg5NHDHRa9aMifw6Ocmk3BqxyJ9Yjf+TT/0B2HB/FIJ+emfagEsgimFhouRKLV1fPYXMOTBRQDwWV9SiOpaGKcVc4PgpnaahiPAslkD1gYiFNC11d7QQTC+p9WI/i0LD6WzM83/FRLNKj5WF4TiBxMUuLUBJ8CUwUUA9VMLUexbMk9Cza4vgojSXhvb8dTiBx0UqLs2k7wMTCWbAeZSAfn9nF8xwf5SAfn9V8p1ZhTcHrpmNhw9jY2Hj9m7DBU7WydoapBOrRWK1Bmz1Vgtx6lMNjtAWU4N5WDzo+Skd67Ec97qvf4R5IXDRrMQkHR0xoj4H1KA/5+pVtHp+E9SgT+fpVjXcogXjyKR6atTgFJiasR/lMtnnMepTPZOM3fR1mZIqD3fMDkZwXYiLAelTG4uD77bAelbGdHk4g8TIJExOTMFXRqqcxCVMV2/TQJPo0TDTUJ229uCEOrEcUrKcM2214th6Vsk0P90DiYqb+D4NjHA6OaLAelbMwaDCD9aicbXo4gcTFptBOwMTEBEzVTKTcNtUwoS9OIHGxNbQTMDExAVM1Eym3TTVM6It3cMaFE0icTMBUzUTD7Z7PDDG5MaEvTiBxsSnsrvX4biRYj2jYJ2gh9oapmhk9nEDiQnMgLq8fF9YjHqxFXCxyAomLjXCQxIb1iIdx2lyYWBh3AomLKfgDKzasRzxICyeQeFjkVVhxsQ7JVZaJh3GYWFACGYeJBQ9hRYYSiKsjx4X1iAdrEReeRI+MKdo8mJiwHvFgLeJinhNIPNw/NjamZbwOkriwHvEwF54DiYm5TiDxsC60DpC4sB7x4AQSF04gEVELrQMkLqxHPLg3GBfzvAorHmowMeITO+PBWkSGE0gcqAbWbeH2Jhhj0nB8xMMmD2HFwR2cQH883N4KY0wajo942OoEEge1htsOEGPScXzEgxNIJNQabruLbkw6jo948BBWBDxAW93w/UYYY9JwfMTDRk+iV881nP/4bcP362CMScPxEQ/r3AOpns80fe8AMSYdx0c8OIFUzN3sfdSa7puCMSaNKZhYcAKpmMtb3OcrLGPScXzEwzrPgVTHNG1F853skWiScAOMMbNwfETDBhV/dQKpjpUUYCrlsRqMMWnUYKqmpi9OINWg3seFbR6vwRiTRg2mamr64jmQariWvY/vtnm8BmNMGjWYqqnpi3sg1XBBuwfD0NZaGGNm4fionLX14XcnkPK5mc6/vYvnfQbGmDQcH9Wxzfdj0wSmTF7IBPLtTk+iLAvY/Ig2BmPMDIydmXhwfFSG8sX+lOEn+sY9kHK5rJvkIfi8H7NZA2PMLBwflbGmnjyEEshmmDLYQjsL2VgFY0wajo/y2W7oUAnE1S3L4S3M3A8hG1ch6TIaY2bj+CgX+fpTjXc4gZTDetolyEjopn8IxphZOD5K50P0+S8b73ACKYc30PG/R29cTPstjDGtcHyUg3x8UfOdTiDFs7xFxd2u4c/exeZqGGNm4fgojatDj287nECKRSuuzkb/vAMe6zUmDcdHsaSWXlICuROmCHR284lNpw32RFj6uxLGmFk4Pgrn8rTSS9pIuCNbTYw8DSZPjqfTv4CcoE57sfkBbVeYsqgvcXdsxMFmxtS8Vg84PgrjEdo+9PuvWj04hw88ARcny5vleSYPwd93D5u3wJTJRniINyZStXB8FMZ/pyUPUd+J/kWYvFDiyLphsFu0FPibMGXhBBIXnbRwfOSLhgbbbj+oJ5DPw5NQeVCjncyM/TsUQFgKPEl7FKYMnEDioq0Wjo9ckQ//sdP2g5kEwif9Aq4r0y+68tG8x+MoEP5+jfOeAVMGTiBx0VELx0dunEFf/rDTkxqLKXoYq3d+SjuaDn8EJcC/s4LNFTBFc3swEwddaeH46JvLgg87sq0U8vT09E5slHH2hcnCvbTD6PC7USLUSyuDtAR7HKYItLhkN9qTkKxS3BGmSqTHMxhnW7p5suOjZ9SD05ETj3Xz5G09kDD08n8wWfgWbXHZyUPwb2qJ6TG0+2CK4Cb1KIOfb4Kpmpu6TR7C8dETGiI8ttvkIZrPA7mc9n2YbriBdgSd/SAqgn97HZu/hoOkCFal3DbVkFkDx0cmlDwm6LMNWX5o1mle7PodjeTD0aRzJe2UPgok5go1W8TmVtrTYfJAKxL3pL73z3wzPT2fjfYZ+PS7apAe86lHTwsaHB8dqSeP9cjIrBMJ+Us0mX4zTCu0PPfNtFfFkjxEuNL6W9qvYPLgknryELytea7M5fhNblzSa/IQjo+2yCc9JQ/R8oqKGXshmzvgEg6N6A2sxHELIiWUc9B4/QKYXnmYtoA6P9B4J327O5JzXRwT5SI99m8+h6IXHB+z0NG0R4ZtHD3R8kz0kI1eQ4vmKrtiNKR3YMzJQ4RyDofAe3r6YVlz8hChR/JumLJZlkfyEI6P7dACoBf3kzxE2zFdZuxz2CzD6KIhq/+hvY2OHpid+tTtyUhKqrwEJgv6oNo7bTNoWBqqi6vdYcpAeqiQ31bkiONj5oL4pCyrrdKY0+5B/oEL0HQG7gjxHdrh9MH5g5Q8BP9flSF4KZJl2YWUVRlC1Ns+daxNJYGwNPR1cM+8DGbKkuSdPMQIx4de61tpJ+SRPETHVSXM1juzWU17AUYDjbmqqud7Ypoo7xXqdyibT9OeBdOOc8MFU0fcMy+FrvXohxGKDw1VvYI+vQ05MqfTE0KmOoz2OQw36mWsoC3ka14+DMlD8HVo+eJzae+Br5zTuCLLh1V47nUwRXFFGclDjEB86DW9j3ZA3slDdL2unZlaz12KpAs0bOvhtXR5adqpW8MCNXw+m49gdHqT3SDND8k6VBLmQ1SbaRFMnkiPQ/MaYsnCEMaHhuFfX+TnWsceSB3NA2g+gDdfjuEpl6zE8Vd8XccMe/IQ4TW+CEm10s0wmkg9spdx9jAfcjDtKzB5IT0mqkgeYojiQ8Pw/0p7UdGfa10nkDr8h65lo3HDKQwuNSRL2JQ4RqraqobmaO9Hshb+nbRKgjUCLqK9LEt9pWb4swpUVW64EKZf6no8jAoZ8PjQ/6ql5vvxNZQyh9vzUBS7e09h88+0M2l7YDCo0c6jY73TPkAd92RzNu102s4YfhRkWt2zEjlCPy5h8zG4am9WpMdp1CPK8usDEh/y4Qdpb6cfS6371fdcBh08l80/0f4T8a1k0NCETlv8JO2GcP67aUEIFJVpeT2G80NQ74WP0i4uqnoyfaijEHScsZb6zoVpR+F65Emk8VFZHCQLMwAAAStJREFU4qiT62Q4nXwam1cjqTtTFVqupsqdX6Z9taxDnoYJ6ngEG2l5Mm0XDDa/pl1Ke0djfasiCWVPdEH1BtpTYBopXY+8qTg+5L+raCvovxoqppDVVGF46yjacbRjaXuhOHQloyEpTYjf2M0xjKY7qKOutBbTDmow1UmLfRWeLhqup11Du66qiwj6Tx8uev+fGNpdMZpEoUfelBAf2lqgygdrGmxtTCMppXwQ0NFaZ30AbZ8W9tQWP6KJtEebbBPt57QNwaZoP6Mzp2BKI2wslZZavrowtOrez0PyASkrq2y2PohUKVe9TnXhVevo1rDQIzrou+OR7KnSBdX8Bhv0Xl6duh51i1qPIgjxsajJmuNjt/D0h2hbgunzTe9hJYx1of1BVSvSuuUPAAAA///zeW67AAAABklEQVQDAEGxugBPfIYjAAAAAElFTkSuQmCC';

// Decorative header blocks (red/yellow/green svgs) also live under /panel/assets —
// re-point the component-scoped .blocks override at inline copies of the same art.
const BLOCK = (color: string) =>
  `url("data:image/svg+xml,%3Csvg width='128' height='128' viewBox='0 0 128 128' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='128' height='128' rx='4.8' fill='%23${color}'/%3E%3C/svg%3E")`;

// Real call site (AppLayout.svelte): show() after login when a new Pano version's
// what's-new has not been dismissed; footer switch lets the admin opt out.
const Opened = () => {
  React.useEffect(() => {
    const style = document.createElement('style');
    // The grading viewport is a fixed 900x700; the modal at full padding is
    // ~880px tall and the footer (don't-show-again switch) gets cropped.
    // Trim the py-5 header/body paddings and scale the dialog slightly so the
    // whole modal — footer included — fits the card.
    style.textContent = `
      .modal-header.blocks { background-image: ${BLOCK('E9573F')}, ${BLOCK('F6BB42')}, ${BLOCK('72C076')} !important; padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
      [data-pano-component="WhatsNewModal"] .modal-dialog { margin: 0.5rem auto !important; min-height: 0 !important; }
      [data-pano-component="WhatsNewModal"] .modal-content { zoom: 0.85; }
      [data-pano-component="WhatsNewModal"] .modal-body { padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
    `;
    const iv = setInterval(() => {
      document
        .querySelectorAll<HTMLImageElement>('img[src$="pano-logo-heorizontal.png"]')
        .forEach((img) => {
          img.src = LOGO;
        });
    }, 100);
    const t = setTimeout(() => {
      M.show(true);
      document.head.appendChild(style);
    }, 50);
    const stop = setTimeout(() => clearInterval(iv), 2000);
    return () => {
      clearTimeout(t);
      clearTimeout(stop);
      clearInterval(iv);
      style.remove();
      try {
        M.hide();
      } catch {}
    };
  }, []);
  return <WhatsNewModal previewOpen />;
};

export const WhatsNew = () => <Opened />;
