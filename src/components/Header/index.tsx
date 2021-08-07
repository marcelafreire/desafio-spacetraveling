import styles from './header.module.scss'
import Link from "next/link";

export function Header() {

  return(
    <header className={styles.headerContainer}>
        <nav>
        <Link href="/">
           <a>
            <img src="/images/Logo.svg" alt="logo"/>
           </a>
        </Link>
        </nav>
    </header>
  );

}
